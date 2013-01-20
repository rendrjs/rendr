isServer = !window?
_ = if isServer then require('underscore') else window._
Backbone = if isServer then require('backbone') else window.Backbone

##
# Base router class shared betwen ClientRouter and ServerRouter.
##

noop = ->

module.exports = class BaseRouter

  ##
  # Config
  #   - errorHandler: function to correctly handle error
  #   - paths
  #     - entryPath (required)
  #     - routes (optional)
  #     - controllerDir (optional)
  #   - stashPerf: optional function to store performance stats
  #   - stashError: optional function to notify server of error
  ##
  options: null

  # Internally stored route definitions.
  _routes: null

  reverseRoutes: false

  constructor: (options) ->
    @_routes = []
    @_initOptions(options)
    @initialize(options)

  initialize: (options) ->

  _initOptions: (options) ->
    @options = options || {}
    @options.paths ||= {}
    @options.paths.entryPath ||= rendr?.entryPath
    if !@options.paths.entryPath?
      throw new Error("Missing entryPath")
    @options.paths.routes ||= @options.paths.entryPath + '/routes'
    @options.paths.controllerDir ||= @options.paths.entryPath + '/controllers'

  getController: (controllerName) ->
    controllerDir = @options.paths.controllerDir || 'controllers'
    require("#{controllerDir}/#{controllerName}_controller")

  # Given an object with 'controller' and 'action' properties,
  # return the corresponding action function.
  getAction: (definition) ->
    controller = @getController(definition.controller)
    controller[definition.action]


 # Build route definitions based on the routes file.
  buildRoutes: ->
    routeBuilder = require(@options.paths.routes)

    routes = []
    captureRoutes = (args...) ->
      routes.push(args)

    try
      routeBuilder(captureRoutes)
      if @reverseRoutes
        routes = routes.reverse()
      for route in routes
        @route.apply(@, route)
    catch e
      throw new Error("Error building routes: #{e.message}")
    @routes()


  # Returns current route definitions.
  routes: ->
    @_routes.slice()

  # Method passed to routes file to build up routes definition.
  # Adds a single route definition.
  route: (pattern, definitions...) =>
    definition = @parseDefinitions(definitions)
    action = @getAction(definition)
    handler = @getHandler(action, definition)
    pattern = "/#{pattern}" unless pattern.slice(0, 1) is '/'
    route = [pattern, definition, handler]
    @_routes.push(route)
    route

  parseDefinitions: (definitions) ->
    definition = {}
    for element in definitions
      # Handle i.e. 'users#show'.
      if _.isString(element)
        parts = element.split('#')
        _.extend definition,
          controller: parts[0]
          action: parts[1]
      # Handle objects.
      else
        _.extend definition, element
    definition


  ##
  # Methods to be extended by subclasses.
  ##

  # This is the method that renders the request.
  getHandler: noop

# Mix in Backbone.Events.
# TODO: Should this be EventEmitter instead?
_.extend BaseRouter.prototype, Backbone.Events
