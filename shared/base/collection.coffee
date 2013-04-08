syncer = require('../syncer')

BaseModel = require('./model')

module.exports = class Base extends Backbone.Collection

  model: BaseModel

  # Provide the ability to set default params for every 'fetch' call.
  defaultParams: null

  constructor: (models, options = {}) ->
    # Capture the options as instance variable.
    @options = options

    # Store a reference to the app instance.
    @app = @options.app

    # Store a reference to the params that were used to
    # query for these models.
    @params = @options.params || {}
    _.defaults @params, @defaultParams || {}

    # Add 'meta' property to store the parts of the response
    # that aren't part of the jsonKey.
    @meta = {}
    if _.isObject(@options.meta)
      _.extend(@meta, @options.meta)
      delete @options.meta

    super

  # Make sure that `model.app` is set for all operations like
  # `this.add()`, `this.reset()`, `this.set()`, `this.push()`, etc.
  _prepareModel: ->
    model = super
    model.app = @app
    model

  # Idempotent parse
  parse: (resp, modifyInstance = true) ->
    parsed = if @jsonKey && (jsonResp = resp[@jsonKey])
      if modifyInstance
        meta = _.omit(resp, @jsonKey)
        _.extend(@meta, meta)
      jsonResp
    else
      resp

    @parseModels(parsed)

  parseModels: (resp) ->
    resp = _.clone(resp)
    jsonKey = @model::jsonKey
    for modelResp, i in resp
      jsonKeyResp = modelResp[jsonKey]
      if jsonKeyResp
        resp[i] = jsonKeyResp
    resp


  fetch: (options = {}) ->
    # Each time new models are fetched, store the params used.
    options.data ||= {}
    _.defaults options.data, @defaultParams || {}
    @params = options.data
    super

  lastCheckedFresh: null

  checkFresh: syncer.checkFresh

  sync: syncer.getSync()

  getUrl: syncer.getUrl

  # Instance method to store the collection and its models.
  store: ->
    @each (model) -> model.store()
    @app.fetcher.collectionStore.set(@)
