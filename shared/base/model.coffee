syncer = require('../syncer')
fetcher = null

module.exports = class Base extends Backbone.Model

  constructor: (models, options = {}) ->
    super

    # Capture the options as instance variable.
    @options = options
    @app = @options.app

    if !@app && @collection
      @app = @collection.app

  # Idempotent parse
  parse: (resp) ->
    if @jsonKey
      resp[@jsonKey] || resp
    else
      resp

  sync: syncer.getSync()

  getUrl: syncer.getUrl

  # Class method to get a Listing instance from the modelStore.
  @fetchFromCache: (id) ->
    fetcher ?= require('../fetcher')
    fetcher.modelStore.get @name, id
