syncer = require('../syncer')

module.exports = class Base extends Backbone.Collection

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
