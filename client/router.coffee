BaseRouter = require('../shared/base/router')
BaseView = require('../shared/base/view')

try
  AppView = require(rendr.entryPath + '/views/app_view')
catch e
  AppView = require('../shared/base/app_view')

extractParamNamesRe = /:(\w+)/g
firstRender = true
noop = ->

module.exports = class ClientRouter extends BaseRouter

  currentFragment: null
  previousFragment: null

  # Instance of Backbone.Router used to manage browser history.
  _router: null

  # We need to reverse the routes in the client because
  # Backbone.History matches in reverse.
  reverseRoutes: true

  constructor: (options) ->
    @_router = new Backbone.Router
    super

  initialize: (options) ->
    @app = options.app

    # We do this here so that it's available in AppView initialization.
    @app.router = @

    @buildRoutes()

    @on 'action:start', @trackAction
    @app.on 'reload', @renderView

    @appView = new AppView({@app})
    @appView.render()

    @postInitialize()

  postInitialize: noop

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

  getHandler: (pattern, definition) ->
    (paramsArray...) =>
      @trigger 'action:start', definition, firstRender
      if firstRender
        views = BaseView.attach(@app)
        @currentView = @getMainView(views)
        @trigger 'action:end', definition, firstRender
        firstRender = false
      else
        params = @getParamsHash(pattern, paramsArray)
        action = @getAction(definition)
        throw new Error("Missing action \"#{definition.action}\" for controller \"#{definition.controller}\"") unless action
        handler = @authenticationFilter(action, definition)
        renderCallback = (args...) =>
          @render(args...)
          @trigger 'action:end', definition, firstRender
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

  getParamsHash: (pattern, paramsArray) ->
    paramNames = _.map(pattern.match(extractParamNamesRe), (name) -> name.slice(1))
    _.inject(paramNames, (memo, name, i) ->
     memo[name] = decodeURIComponent(paramsArray[i])
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
    hashParts = path.split('#')
    path = hashParts[0]

    # But then trigger the hash afterwards.
    if hashParts.length > 1
      hashHandler = =>
        window.location.hash = hashParts[1]
        # There is no 'one' or 'once' in Backbone.Events.
        @off 'action:end', hashHandler

      @on 'action:end', hashHandler

    # Ignore hash for routing.
    @navigate(path, options)

  render: (err, view_key, data = {}) =>
    @currentView.remove() if @currentView

    # Inject the app.
    data.app = @app

    View = @getView(view_key)
    @currentView = new View data
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
