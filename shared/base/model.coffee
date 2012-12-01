syncer = require('../syncer')
fetcher = null

module.exports = class Base extends Backbone.Model

  constructor: (models, options = {}) ->
    # Capture the options as instance variable.
    @options = options

    # Store a reference to the app instance.
    @app = @options.app

    super

    if !@app && @collection
      @app = @collection.app

    @on 'change', @updateInModelStore

  # Override 'add' to make sure models have '@app' attribute.
  add: (models, options) ->
    models = [models] unless _.isArray(models)

    model.app = @app for model in models

    super models, options


  # TODO: Should we keep a reference on the model to its modelStore?
  # Or not, because there could be a one-to-many mapping?
  # Or should it only exist in one?
  updateInModelStore: =>
    getFetcher().modelStore.set @constructor.name, @

  # Idempotent parse
  parse: (resp) ->
    if @jsonKey
      resp[@jsonKey] || resp
    else
      resp

  sync: syncer.getSync()

  getUrl: syncer.getUrl

  # Class method to store in the modelStore.
  store: ->
    getFetcher().modelStore.set @constructor.name, @

  # Class method to get a model instance from the modelStore.
  @fetchFromCache: (id) ->
    getFetcher().modelStore.get(@name, id, true)

getFetcher = ->
  fetcher ?= require('../fetcher')
