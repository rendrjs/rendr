syncer = require('../syncer')

BaseModel = require('./model')

module.exports = class Base extends Backbone.Collection

  model: BaseModel

  constructor: (models, options = {}) ->
    # Capture the options as instance variable.
    @options = options

    # Store a reference to the app instance.
    @app = @options.app

    super

    # Store a reference to the params that were used to
    # query for these models.
    @params = @options.params || {}

    # Add 'meta' property to store the parts of the response
    # that aren't part of the jsonKey.
    @meta = {}
    _.extend(@meta, @options.meta) if _.isObject(@options.meta)

  # Idempotent parse
  parse: (resp) ->
    if @jsonKey && (jsonResp = resp[@jsonKey])
      meta = _.omit(resp, @jsonKey)
      _.extend(@meta, meta)
      jsonResp
    else
      resp

  fetch: (options = {}) ->
    # Each time new models are fetched, store the params used.
    @params = options.data || {}
    super

  sync: syncer.getSync()

  getUrl: syncer.getUrl
