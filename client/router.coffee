BaseRouter = require('../shared/base/router')
BaseView = require('../shared/base/view')

try
  AppView = require(rendr.entryPath + 'app/views/app_view')
catch e
  AppView = require('../shared/base/app_view')

extractParamNamesRe = /:(\w+)/g
plusRe = /\+/g
firstRender = true
noop = ->

module.exports = class ClientRouter extends BaseRouter

  currentFragment: null
  previousFragment: null

  # In a controller action, can access the current route
  # definition with `this.currentRoute`.
  currentRoute: null

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

    @on 'route:add', @addBackboneRoute
    @buildRoutes()

    @on 'action:start', @trackAction
    @app.on 'reload', @renderView

    @appView = new AppView({@app})
    @appView.render()

    @postInitialize()

  postInitialize: noop

  # Piggyback on adding new route definition events
  # to also add to Backbone.Router.
  addBackboneRoute: (routeObj) =>
    [pattern, route, handler] = routeObj
    name = "#{route.controller}:#{route.action}"
    # Backbone.History wants no leading slash.
    @_router.route pattern.slice(1), name, handler

  getHandler: (action, pattern, route) ->
    (paramsArray...) =>
      @trigger 'action:start', route, firstRender
      @currentRoute = route
      if firstRender
        views = BaseView.attach(@app)
        @currentView = @getMainView(views)
        @trigger 'action:end', route, firstRender
        firstRender = false
      else
        params = @getParamsHash(pattern, paramsArray, window.location.search)
        throw new Error("Missing action \"#{route.action}\" for controller \"#{route.controller}\"") unless action
        renderCallback = (args...) =>
          @render(args...)
          @trigger 'action:end', route, firstRender
        action.call(@, params, renderCallback)

  # Hmm, there's probably a better way to do this.
  # By default, expect that there's only a single, main
  # view in the layout. Can be overridden by applications
  # if the initial render is more complicated.
  getMainView: (views) ->
    $content = @appView.$content
    _.find views, (view) ->
      view.$el.parent().is($content)

  # Proxy to Backbone.Router.
  navigate: (args...) ->
    @_router.navigate.apply(@_router, args)

  getParamsHash: (pattern, paramsArray, search) ->
    paramNames = _.map(pattern.match(extractParamNamesRe), (name) -> name.slice(1))
    params = _.inject(paramNames, (memo, name, i) ->
      memo[name] = decodeURIComponent(paramsArray[i])
      memo
    , {})
    query = _.inject(search.slice(1).split('&'), (memo, queryPart) ->
      parts = queryPart.split('=')
      if parts.length > 1
        memo[parts[0]] = decodeURIComponent(parts[1].replace(plusRe, ' '))
      memo
    , {})
    _.extend(query, params)

  matchingRoute: (path) ->
    _.find Backbone.history.handlers, (handler) ->
      handler.route.test(path)

  matchesAnyRoute: (path) ->
    @matchingRoute(path)?

  redirectTo: (path, options = {}) ->
    _.defaults options,
      trigger: true
      pushState: true

    # Do a full-page redirect.
    if options.pushState is false
      window.location.href = path

    # Do a pushState navigation.
    else
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
