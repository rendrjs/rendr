
# queryObj looks like:
#
#   {
#      listing: {model: 'Listing', id: 3}
#   }
#
# or
#
#   {
#      listing: {model: 'Listing', params: {id: 3}},
#      reviews: {collection: 'Reviews', params: {listingId: 3, offset: 0, per_page: 10}}
#   }
#
# listing = new Listing
# listing.fetch(params)
# // /listings/3
#
# reviews = new Reviews
# reviews.fetch(params)
#
# Listing.prototype.url
# Listing.prototype.fetch.call(context)
#
# // /reviews?listingId=3&offset=0&per_page=10
# // /listings/3/reviews?offset=0&per_page=10
#
# and returns an identifying object:
#
#   {
#      listing: {model: 'Listing', id: 3},
#      reviews: {collection: 'Reviews', ids: [1,3,5,8]}
#   }

async = if global.isServer then require('async') else window.async

modelUtils = require('./model_utils')
ModelStore = require('./store/model_store')
CollectionStore = require('./store/collection_store')

modelStore = exports.modelStore = new ModelStore
collectionStore = exports.collectionStore = new CollectionStore

# Mixin Backbone.Events for events that work in client & server.
_.extend exports, Backbone.Events

# Returns an instance of Model or Collection.
exports.getModelForSpec = getModelForSpec = (spec, attrsOrModels = {}, options = {}) ->
  if spec.model?
    method = 'getModel'
    modelName = spec.model
  else
    method = 'getCollection'
    modelName = spec.collection

  # We have to initialize the model with its ID for now
  # so that the model can interpolate its url '/listings/:id'
  # to i.e. '/listings/42'. See 'syncer' module.
  if spec.params?
    if spec.model?
      # If it's a model, merge the given params with the model attributes.
      _.defaults attrsOrModels, spec.params
    else if spec.collection?
      #  If it's a collection, merge the given params with the options.
      _.defaults options, spec.params

  _.defaults options,
    app: exports.app

  modelUtils[method](modelName, attrsOrModels, options)

# map fetchSpecs to models and fetch data in parallel
retrieve = (fetchSpecs, options, callback) ->
  batchedRequests = {}

  _.each fetchSpecs, (spec, name) ->
    batchedRequests[name] = (cb) ->
      if !options.readFromCache
        fetchFromApi(spec, cb)
      else
        modelData = null
        modelOptions = {}

        # First, see if we have stored the model or collection.
        if spec.model?
          modelData = modelStore.get(spec.model, spec.params.id)
        else if spec.collection?
          collectionData = collectionStore.get(spec.collection, spec.params)
          if collectionData
            modelData = retrieveModelsForCollectionName(spec.collection, collectionData.ids)
            modelOptions =
              meta: collectionData.meta

        if modelData? && !isMissingKeys(modelData, spec.ensureKeys)
          model = getModelForSpec(spec, modelData, modelOptions)
          cb(null, model)
        else
          # Else, fetch anew.
          fetchFromApi(spec, cb)

  async.parallel batchedRequests, callback

exports.isMissingKeys = isMissingKeys = (modelData, keys) ->
  return false unless keys?
  keys = [keys] unless _.isArray(keys)
  for key in keys
    return true unless modelData[key]?
  false

fetchFromApi = (spec, callback) ->
  model = getModelForSpec(spec)
  model.fetch
    data: spec.params
    success: (model, body) ->
      callback(null, model)
    error: (model, body, options) ->
      err = new Error(body)
      callback(err)

retrieveModelsForCollectionName = (collectionName, modelIds) ->
  modelName = modelUtils.getModelNameForCollectionName(collectionName)
  retrieveModels(modelName, modelIds)

exports.retrieveModels = retrieveModels = (modelName, modelIds) ->
  _.map modelIds, (id) ->
    modelStore.get(modelName, id)

exports.summarize = summarize = (modelOrCollection) ->
  # Is it a Collection?
  summary = {}
  if modelUtils.isCollection(modelOrCollection)
    summary =
      collection: modelOrCollection.constructor.name
      ids: modelOrCollection.pluck('id')
      params: modelOrCollection.params
      meta: modelOrCollection.meta
  else if modelUtils.isModel(modelOrCollection)
    summary =
      model: modelOrCollection.constructor.name
      id: modelOrCollection.id
  summary

exports.storeResults = storeResults = (results) ->
  for own name, modelOrCollection of results
    modelOrCollection.store()

exports.hydrate = (summaries, options = {}) ->
  results = {}
  for own name, summary of summaries
    if summary.model?
      results[name] = modelStore.get(summary.model, summary.id, true)
    # Also support getting all models for a collection.
    else if summary.collection?
      collectionData = collectionStore.get(summary.collection, summary.params)
      throw new Error("Collection of type \"#{summary.collection}\" not found for params: #{JSON.stringify(summary.params)}") unless collectionData?
      models = retrieveModelsForCollectionName(summary.collection, collectionData.ids)
      options =
        params: summary.params
        meta: collectionData.meta
      results[name] = modelUtils.getCollection(summary.collection, models, options)
    if results[name]? and options.app?
      results[name].app = options.app
  results

exports.pendingFetches = 0

exports.fetch = (fetchSpecs, options, callback) ->
  # Support both (fetchSpecs, options, callback)
  # and (fetchSpecs, callback).
  if arguments.length is 2
    callback = options
    options = {}
  else
    options ||= {}

  if global.isServer
    options.readFromCache ?= false
    options.writeToCache ?= false
  else
    options.readFromCache ?= true
    options.writeToCache ?= true

  exports.pendingFetches++
  exports.trigger 'fetch:start', fetchSpecs
  retrieve fetchSpecs, options, (err, results) ->
    exports.pendingFetches--
    exports.trigger 'fetch:end', fetchSpecs
    return callback(err) if err

    if options.writeToCache
      storeResults results

    callback(null, results)
