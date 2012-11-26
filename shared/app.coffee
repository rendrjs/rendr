# This is the app instance that is shared between client and server.
# The client also subclasses it for client-specific stuff.

require('./globals');

fetcher = require('./fetcher')
ClientRouter = require('../client/router')

module.exports = class App extends Backbone.Model
  defaults:
    loading: false

  # @shared
  initialize: ->
    @fetcher = fetcher
    @fetcher.app = @

  # To be overridden.
  loggedIn: ->
    false

  # @client
  bootstrapData: (modelMap) ->
    results = {}
    for own name, map of modelMap
      modelOrCollection = @fetcher.getModelForSpec(map.summary, map.data, params: map.params)
      results[name] = modelOrCollection
    @fetcher.storeModels results

  # @client
  start: ->
    @router = new ClientRouter(app: @)

    Backbone.history.start
      pushState: true
