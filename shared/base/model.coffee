syncer = require('../syncer')

module.exports = class Base extends Backbone.Model

  constructor: (models, options = {}) ->
    super

    # Capture the options as instance variable.
    @options = options
    @app = @options.app

  # Idempotent parse
  parse: (resp) ->
    if @jsonKey
      resp[@jsonKey] || resp
    else
      resp

  sync: syncer.getSync()

  getUrl: syncer.getUrl
