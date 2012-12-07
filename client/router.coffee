BaseView = require('../shared/base/view')

try
  AppView = require(rendr.entryPath + '/views/app_view')
catch e
  AppView = require('../shared/base/app_view')

extractParamNamesRe = /:(\w+)/g
firstRender = true

module.exports = class Router extends Backbone.Router

  currentFragment: null
  previousFragment: null

  initialize: (options) ->
    @app = options.app
    @initRoutes()
    @on 'action:start', @trackAction
    @app.on 'reload', @renderView

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
      @trigger 'action:start', route
      if firstRender
        firstRender = false
        views = BaseView.attach(@app)
        @currentView = @getMainView(views)
        @trigger 'action:end', route
      else
        params = @getParamsHash(pattern, paramsArray)
        handler = @getController(route.controller)[route.action]
        throw new Error("Missing action \"#{route.action}\" for controller \"#{route.controller}\"") unless handler
        handler = @authenticationFilter(handler, route)
        renderCallback = (args...) =>
          @render(args...)
          @trigger 'action:end', route
        handler.call(@, params, renderCallback)

  # Hmm, there's probably a better way to do this.
  # By default, expect that there's only a single, main
  # view in the layout. Can be overridden by applications
  # if the initial render is more complicated.
  getMainView: (views) ->
    views[0]

  authenticationFilter: (handler, route) ->
    (params, callback) =>
      if route.role && route.role != 'guest' && !@app.loggedIn()
        fragment = encodeURIComponent(Backbone.history.fragment)
        @redirectTo("/login?redirect=#{fragment}", replace: true)
      else
        handler.call(@, params, callback)

  getController: (controller) ->
    require("controllers/#{controller}_controller")

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
