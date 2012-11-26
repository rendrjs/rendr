syncer = require('../syncer')

BaseModel = require('./model')

module.exports = class Base extends Backbone.Collection

  model: BaseModel

  meta: {}

  constructor: (models, options = {}) ->
    super

    # Capture the options as instance variable.
    @options = options

    # Store a reference to the app instance.
    @app = @options.app

    # Store a reference to the params that were used to
    # query for these models.
    @params = @options.params

    _.extend(@meta, options.meta) if options.meta?


  # Idempotent parse
  parse: (resp) ->
    _.extend(@meta, resp.meta) if resp.meta?
    if @jsonKey
      resp[@jsonKey] || resp
    else
      resp

  fetch: (options = {}) ->
    # Each time new models are fetched, store the params used.
    @params = options.data || {}
    super

  sync: syncer.getSync()

  getUrl: syncer.getUrl
