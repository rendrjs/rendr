# This is the app instance that is shared between client and server.
# The client also subclasses it for client-specific stuff.

if window?
  window.isServer = false
  window.global = window
  window.rendr = {
    entryPath: ''
  }
else
  global.isServer = true

if isServer
  global._ = require('underscore')
  global.Backbone = require('backbone')
  global.Handlebars = require('handlebars')
  global.Polyglot = require('node-polyglot')


fetcher = require('./fetcher')
Router = require('../client/router')

# SessionManager = require('./models/session_manager')
# State = require('./models/state')

module.exports = class App extends Backbone.Model
  defaults:
    loading: false

  Data: {}

  # @shared
  initialize: ->
    # @SessionManager = new SessionManager {}, {app: @}
    # @State = new State @get('state')

    @fetcher = fetcher
    @fetcher.app = @

  # @client
  bootstrapData: (modelMap) ->
    results = {}
    for own name, map of modelMap
      modelOrCollection = @fetcher.getModelForSpec(map.summary, map.data)
      results[name] = modelOrCollection
    @fetcher.storeModels results

  # @client
  start: ->
    @router = new Router(app: @)

    Backbone.history.start
      pushState: true
