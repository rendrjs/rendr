# This is the app instance that is shared between client and server.
# The client also subclasses it for client-specific stuff.

require('./globals')

fetcher = require('./fetcher')
ClientRouter = require(rendr.entryPath + "/app/router") unless global.isServer

noop = ->

module.exports = class App extends Backbone.Model
  defaults:
    loading: false

  # @shared
  initialize: ->
    @fetcher = fetcher
    @fetcher.app = @

    if !global.isServer
      new ClientRouter(app: @)

    @postInitialize()

  postInitialize: noop

  # @shared
  fetch: (args...) ->
    @fetcher.fetch.apply(@fetcher, args)

  # @client
  bootstrapData: (modelMap) ->
    @fetcher.bootstrapData(modelMap)

  # @client
  start: ->
    @router.start()
