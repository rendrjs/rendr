Backbone = require('backbone')
syncer = require('../syncer')

module.exports = class Base extends Backbone.Model

  constructor: (models, options = {}) ->
    # Capture the options as instance variable.
    @options = options

    # Store a reference to the app instance.
    @app = @options.app

    super

    if !@app && @collection
      @app = @collection.app

    @on 'change', @store

  # Idempotent parse
  parse: (resp) ->
    if @jsonKey
      resp[@jsonKey] || resp
    else
      resp

  checkFresh: syncer.checkFresh

  sync: syncer.getSync()

  getUrl: syncer.getUrl

  # Instance method to store in the modelStore.
  store: =>
    @app.fetcher.modelStore.set(@)
