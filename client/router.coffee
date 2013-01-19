BaseView = require('../shared/base/view')

try
  AppView = require(rendr.entryPath + '/views/app_view')
catch e
  AppView = require('../shared/base/app_view')

extractParamNamesRe = /:(\w+)/g
firstRender = true

module.exports = class Router

  currentFragment: null
  previousFragment: null

  # Internally stored route definitions.
  _routes: null

  # Instance of Backbone.Router used to manage browser history.
  _router: null

  constructor: (options) ->
    @_routes = []
    @_router = new Backbone.Router
    @initialize(options)

  initialize: (options) ->
    @app = options.app

    @buildRoutes()

    @on 'action:start', @trackAction
    @app.on 'reload', @renderView

    @appView = new AppView({@app})
    @appView.render()

    @postInitialize()

  postInitialize: ->

  buildRoutes: ->
    routeBuilder = require(rendr.entryPath + '/routes')

    # Sadly, we have to call '@route()' in reverse order, so
    # Express + Backbone handle it the same way.
    capturedRoutes = []
    captureRoutes = (args...) ->
      capturedRoutes.push(args)

    try
      routeBuilder(captureRoutes)
      for route in capturedRoutes.reverse()
        @route.apply(@, route)
    catch e
      throw new Error("Error building routes: #{e.message}")
    @routes()

  route: (pattern, definitions...) =>
    definition = @parseDefinitions(definitions)
    handler = @getHandler(pattern, definition)
    pattern = "/#{pattern}" unless pattern.slice(0, 1) is '/'
    route = [pattern, definition, handler]
    @_routes.push(route)

    # Add to Backbone.Router
    name = "#{definition.controller}:#{definition.action}"
    # Backbone.History wants no leading slash.
    backbonePattern = pattern.slice(1)
    @_router.route backbonePattern, name, handler

    route

  # Returns current route definitions.
  routes: ->
    @_routes.slice()

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

  getHandler: (pattern, definition) ->
    (paramsArray...) =>
      @trigger 'action:start', definition
      if firstRender
        firstRender = false
        views = BaseView.attach(@app)
        @currentView = @getMainView(views)
        @trigger 'action:end', definition
      else
        params = @getParamsHash(pattern, paramsArray)
        action = @getAction(definition)
        throw new Error("Missing action \"#{definition.action}\" for controller \"#{definition.controller}\"") unless action
        handler = @authenticationFilter(action, definition)
        renderCallback = (args...) =>
          @render(args...)
          @trigger 'action:end', definition
        handler.call(@, params, renderCallback)

  # Hmm, there's probably a better way to do this.
  # By default, expect that there's only a single, main
  # view in the layout. Can be overridden by applications
  # if the initial render is more complicated.
  getMainView: (views) ->
    views[0]

  # Proxy to Backbone.Router.
  navigate: (args...) ->
    @_router.navigate.apply(@_router, args)

  authenticationFilter: (handler, route) ->
    (params, callback) =>
      if route.role && route.role != 'guest' && !@app.loggedIn()
        fragment = encodeURIComponent(Backbone.history.fragment)
        @redirectTo("/login?redirect=#{fragment}", replace: true)
      else
        handler.call(@, params, callback)

  getController: (controller) ->
    require("controllers/#{controller}_controller")

  getAction: (definition) ->
    controller = @getController(definition.controller)
    controller[definition.action]

  getParamsHash: (pattern, paramsArray) ->
    paramNames = _.map(pattern.match(extractParamNamesRe), (name) -> name.slice(1))
    _.inject(paramNames, (memo, name, i) ->
     memo[name] = paramsArray[i]
     memo
    , {})

  matchingRoute: (path) ->
    _.find Backbone.history.handlers, (handler) ->
      handler.route.test(path)

  matchesAnyRoute: (path) ->
    @matchingRoute(path)?

  redirectTo: (path, options = {}) ->
    _.defaults options,
      trigger: true
    @navigate path, options

  render: (err, view_key, data = {}) =>
    @currentView.remove() if @currentView

    # Inject the app.
    data.app = @app

    View = @getView(view_key)
    @currentView = new View data
    $(window).scrollTop 0
    @renderView()

  renderView: =>
    @appView.setCurrentView(@currentView)

  start: ->
    Backbone.history.start
      pushState: true
      hashChange: false

  trackAction: (route) =>
    @previousFragment = @currentFragment
    @currentFragment = Backbone.history.getFragment()

  getView: (key) ->
    View = BaseView.getView(key)
    if not _.isFunction(View)
      throw new Error("View '#{key}' not found.")
    View

# Mix in Backbone.Events.
# TODO: Should this be EventEmitter instead?
_.extend module.exports.prototype, Backbone.Events
