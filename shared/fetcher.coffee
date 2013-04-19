# fetchSpec looks like:
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

modelUtils = require('./modelUtils')
ModelStore = require('./store/model_store')
CollectionStore = require('./store/collection_store')

module.exports = class Fetcher

  constructor: (@options) ->
    @app = @options.app
    @modelStore = new ModelStore({@app})
    @collectionStore = new CollectionStore({@app})


  # Returns an instance of Model or Collection.
  getModelForSpec: (spec, attrsOrModels = {}, options = {}) ->
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
      app: @app

    modelUtils[method](modelName, attrsOrModels, options)

  # Used to hold timestamps of when 'checkFresh()' was called on a model/collection.
  # We use this to throttle it in 'shouldCheckFresh()'.
  checkedFreshTimestamps: {}

  # Only once every ten seconds. Smarter?
  checkedFreshRate: 10000

  shouldCheckFresh: (spec) ->
    key = @checkedFreshKey(spec)
    timestamp = @checkedFreshTimestamps[key]
    return true if !timestamp
    return true if new Date().getTime() - timestamp > @checkedFreshRate
    false

  didCheckFresh: (spec) ->
    key = @checkedFreshKey(spec)
    @checkedFreshTimestamps[key] = new Date().getTime()

  checkedFreshKey: (spec) ->
    meta =
      name: spec.model || spec.collection
      params: spec.params
    JSON.stringify(meta)

  # map fetchSpecs to models and fetch data in parallel
  _retrieve: (fetchSpecs, options, callback) ->
    batchedRequests = {}

    _.each fetchSpecs, (spec, name) =>
      batchedRequests[name] = (cb) =>
        if !options.readFromCache
          @fetchFromApi(spec, cb)
        else
          modelData = null
          modelOptions = {}

          # First, see if we have stored the model or collection.
          if spec.model?
            idAttribute = modelUtils.modelIdAttribute(spec.model)
            modelData = @modelStore.get(spec.model, spec.params[idAttribute])
          else if spec.collection?
            collectionData = @collectionStore.get(spec.collection, spec.params)
            if collectionData
              modelData = @retrieveModelsForCollectionName(spec.collection, collectionData.ids)
              modelOptions =
                meta: collectionData.meta

          # If we found the model/collection in the store, then return that.
          if modelData? && !@isMissingKeys(modelData, spec.ensureKeys)
            model = @getModelForSpec(spec, modelData, modelOptions)

            # If 'checkFresh' is set (and we're in the client), then before we
            # return the cached object we fire off a fetch, compare the results,
            # and if the data is different, we trigger a 'refresh' event.
            if spec.checkFresh && !global.isServer && @shouldCheckFresh(spec)
              model.checkFresh()
              @didCheckFresh(spec)
            cb(null, model)
          else
            # Else, fetch anew.
            @fetchFromApi(spec, cb)

    async.parallel batchedRequests, callback

  isMissingKeys: (modelData, keys) ->
    return false unless keys?
    keys = [keys] unless _.isArray(keys)
    for key in keys
      return true unless modelData[key]?
    false

  fetchFromApi: (spec, callback) ->
    model = @getModelForSpec(spec)
    model.fetch
      data: spec.params
      success: (model, body) ->
        callback(null, model)
      error: (model, body, options) ->
        bodyOutput = if typeof body is 'string' then body.slice(0, 150) else JSON.stringify(body)
        err = new Error("ERROR fetching model '#{modelUtils.modelName(model.constructor)}' with options '#{JSON.stringify(options)}'. Response: " + bodyOutput)
        err.status = body.status
        callback(err)

  retrieveModelsForCollectionName: (collectionName, modelIds) ->
    modelName = modelUtils.getModelNameForCollectionName(collectionName)
    @retrieveModels(modelName, modelIds)

  retrieveModels: (modelName, modelIds) ->
    _.map modelIds, (id) =>
      @modelStore.get(modelName, id)

  summarize: (modelOrCollection) ->
    summary = {}
    if modelUtils.isCollection(modelOrCollection)
      idAttribute = modelOrCollection.model.prototype.idAttribute
      summary =
        collection: modelUtils.modelName(modelOrCollection.constructor)
        ids: modelOrCollection.pluck(idAttribute)
        params: modelOrCollection.params
        meta: modelOrCollection.meta
    else if modelUtils.isModel(modelOrCollection)
      idAttribute = modelOrCollection.idAttribute
      summary =
        model: modelUtils.modelName(modelOrCollection.constructor)
        id: modelOrCollection.get(idAttribute)
    summary

  storeResults: (results) ->
    for own name, modelOrCollection of results
      modelOrCollection.store()

  bootstrapData: (modelMap) ->
    results = {}
    for own name, map of modelMap
      modelOrCollection = @getModelForSpec(map.summary, map.data, _.pick(map.summary, 'params', 'meta'))
      results[name] = modelOrCollection
    @storeResults(results)

  hydrate: (summaries, options = {}) ->
    results = {}
    for own name, summary of summaries
      if summary.model?
        results[name] = @modelStore.get(summary.model, summary.id, true)
      # Also support getting all models for a collection.
      else if summary.collection?
        collectionData = @collectionStore.get(summary.collection, summary.params)
        throw new Error("Collection of type \"#{summary.collection}\" not found for params: #{JSON.stringify(summary.params)}") unless collectionData?
        models = @retrieveModelsForCollectionName(summary.collection, collectionData.ids)
        collectionOptions =
          params: summary.params
          meta: collectionData.meta
        results[name] = modelUtils.getCollection(summary.collection, models, collectionOptions)
      if results[name]? and options.app?
        results[name].app = options.app
    results

  pendingFetches: 0

  fetch: (fetchSpecs, options, callback) ->
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

    @pendingFetches++
    @trigger 'fetch:start', fetchSpecs
    @_retrieve fetchSpecs, options, (err, results) =>
      @pendingFetches--
      @trigger 'fetch:end', fetchSpecs
      return callback(err) if err

      if options.writeToCache
        @storeResults results

      callback(null, results)

# Mixin Backbone.Events for events that work in client & server.
_.extend Fetcher.prototype, Backbone.Events
