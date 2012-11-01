# This is the app instance that is shared between client and server.
# The client also subclasses it for client-specific stuff.

if window?
  window.isServer = false
  window.global = window
else
  global.isServer = true

if isServer
  global._ = require('underscore')
  global.Backbone = require('backbone')
  global.Handlebars = require('handlebars')
  global.Polyglot = require('node-polyglot')


fetcher = require('./fetcher')
SessionManager = require('./models/session_manager')
# State = require('./models/state')

instance = null

module.exports = class App extends Backbone.Model
  defaults:
    loading: false

  Data: {}

  initialize: ->
    @SessionManager = new SessionManager {}, {app: @}
    # @State = new State @get('state')

    @fetcher = fetcher
    @fetcher.app = @
