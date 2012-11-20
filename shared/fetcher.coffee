
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
MemoryStore = require('./memory_store')
ModelStore = require('./model_store')

responseStore = exports.responseStore = new MemoryStore
modelStore = exports.modelStore = new ModelStore

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

  for own name, spec of fetchSpecs
    batchedRequests[name] = (cb) ->
      if !options.readFromCache
        fetchFromApi(spec, cb)
      else
        # First, see if it's a model, and we have stored it.
        if spec.model?
          modelData = modelStore.get spec.model, spec.params.id
        if modelData? && !isMissingKeys(modelData.toJSON(), spec.ensureKeys)
          model = getModelForSpec(spec, modelData)
          cb(null, model)
        else
          # Then, see if we have cached this data.
          getResponseFromStore spec, (err, value) ->
            return cb(err) if err
            if value?
              model = getModelForSpec(spec, value)
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

getResponseFromStore = (spec, callback) ->
  key = getResponseStoreKey(spec)
  value = responseStore.get key
  if value?
    console.log "FETCHER: Cache HIT for key: \"#{key}\"."
  else
    console.log "FETCHER: Cache MISS for key: \"#{key}\"."
  callback(null, value)

storeResponse = (results, fetchSpecs) ->
  for own name, model of results
    spec = fetchSpecs[name]
    key = getResponseStoreKey(spec)
    expires = spec.expires || 0
    responseStore.set key, model.toJSON(), expires

# TODO key should be independent of params order
# I.e., params = {per_page: 10, offset: 0} should
# return same key as params = {offset: 0, per_page: 10}
getResponseStoreKey = (spec) ->
  modelKey = spec.model || spec.collection
  params = spec.params
  paramsKey = if params? then JSON.stringify(params) else ''
  "#{modelKey}:#{paramsKey}"

exports.summarize = summarize = (modelOrCollection) ->
  # Is it a Collection?
  summary = {}
  if modelUtils.isCollection(modelOrCollection)
    summary =
      collection: modelOrCollection.constructor.name
      ids: modelOrCollection.pluck('id')
  else if modelUtils.isModel(modelOrCollection)
    summary =
      model: modelOrCollection.constructor.name
      id: modelOrCollection.id
  summary

# TODO don't just remove the 's'
getModelNameFromCollectionName = (collectionName) ->
  collectionName.slice(0, collectionName.length - 1)

exports.storeModels = storeModels = (results) ->
  for own name, modelOrCollection of results
    summary = summarize(modelOrCollection)
    if summary.model?
      modelStore.set summary.model, modelOrCollection
    # Also support putting all models for a collection.
    else
      summary.ids.forEach (id) ->
        model = modelOrCollection.get(id)
        modelName = getModelNameFromCollectionName(summary.collection)
        modelStore.set modelName, model

exports.hydrate = (summaries, options = {}) ->
  results = {}
  for own name, summary of summaries
    if summary.model?
      results[name] = modelStore.get(summary.model, summary.id)
    # Also support getting all models for a collection.
    else if summary.collection?
      models = []
      _.each summary.ids, (id) ->
        modelName = getModelNameFromCollectionName(summary.collection)
        models.push modelStore.get(modelName, id)
      results[name] = modelUtils.getCollection(summary.collection, models)
    if results[name]? and options.app?
      results[name].app = options.app
  results

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

  retrieve fetchSpecs, options, (err, results) ->
    return callback(err) if err

    if options.writeToCache
      storeResponse results, fetchSpecs
      storeModels results

    callback(null, results)
