syncer = require('../syncer')

BaseModel = require('./model')

module.exports = class Base extends Backbone.Collection

  model: BaseModel

  meta: {}

  constructor: (models, options = {}) ->
    super

    # Capture the options as instance variable.
    @options = options
    @app = @options.app

    _.extend(@meta, options.meta) if options.meta?


  # Idempotent parse
  parse: (resp) ->
    _.extend(@meta, resp.meta) if resp.meta?
    if @jsonKey
      resp[@jsonKey] || resp
    else
      resp

  sync: syncer.getSync()

  getUrl: syncer.getUrl
