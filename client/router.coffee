BaseView = require('../shared/base_view')

try
  AppView = require(rendr.entryPath + '/views/app_view')
catch e
  AppView = require('../shared/app_view')

extractParamNamesRe = /:(\w+)/g
firstRender = true

module.exports = class Router extends Backbone.Router

  currentFragment: null
  previousFragment: null

  initialize: (options) ->
    @app = options.app
    @initRoutes()
    @on 'action', @trackAction

    @appView = new AppView({@app})
    @appView.render()

    @postInitialize()

  postInitialize: ->

  initRoutes: ->
    routes = require(rendr.entryPath + '/routes')

    # We have to iterate through the routes backwards,
    # so Backbone.History matches in same order as Express.
    patterns = _.keys(routes).reverse()
    routeInfos = _.values(routes).reverse()

    for pattern, i in patterns
      route = routeInfos[i]
      controller = route.controller
      action = route.action
      name = "#{controller}:#{action}"
      @route pattern, name, @getHandler(pattern, route)

  getHandler: (pattern, route) ->
    (paramsArray...) =>
      @trigger 'action', route
      if firstRender
        firstRender = false
        BaseView.attach(@app)
      else
        params = @getParamsHash(pattern, paramsArray)
        handler = @getController(route.controller)[route.action]
        handler = @authenticationFilter(handler, route)
        handler.call(@, params, @render)

  authenticationFilter: (handler, route) ->
    (params, callback) =>
      if route.authenticated && false # !@app.SessionManager.loggedIn()
        @redirectTo('/login')
      else
        handler.call(@, params, callback)

  getController: (controller) ->
    require("controllers/#{controller}_controller")

  getParamsHash: (pattern, paramsArray) ->
    paramNames = _.map(pattern.match(extractParamNamesRe), (name) -> name.slice(1))
    paramsHash = {}
    for param, i in paramsArray
      paramsHash[paramNames[i]] = paramsArray[i]
    paramsHash

  redirectTo: (path) ->
    @navigate path, true

  render: (err, view_key, data = {}) =>
    @currentView.remove() if @currentView

    # Inject the app.
    data.app = @app

    View = @getView(view_key)
    @currentView = new View data
    $(window).scrollTop 0
    @appView.setCurrentView(@currentView)

  trackAction: (route) =>
    @previousFragment = @currentFragment
    @currentFragment = Backbone.history.getFragment()

  getView: (key) ->
    View = BaseView.getView(key)
    if not _.isFunction(View)
      throw new Error("View '#{key}' not found.")
    View
