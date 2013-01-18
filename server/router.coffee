module.exports = class Router

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
  config: null

  constructor: (config, callback) ->
    @initialize(config, callback)

  initialize: (config, callback) ->
    @config = config || {}
    callback ||= ->

    if !config.paths || !config.paths.entryPath
      return callback(new Error("Missing entryPath"))
    config.paths.routes ||= config.paths.entryPath + '/routes'
    config.paths.controllerDir ||= config.paths.entryPath + '/controllers'
    callback()

  getController: (controllerName) ->
   require("#{@config.paths.controllerDir}/#{controllerName}_controller")

  # Given an object with 'controller' and 'action' properties,
  # return the corresponding action function.
  getAction: (spec) ->
    controller = @getController(spec.controller)
    controller[spec.action]

  # This is the method that renders the request.
  getHandler: (action, routeInfo) ->
    router = @

    (req, res, next) ->
      context =
        app: req.rendrApp
        redirectTo: (url) -> res.redirect(url)

      params = req.query || {}
      req.route.keys.forEach (routeKey) ->
        params[routeKey.name] = req.route.params[routeKey.name]

      start = new Date
      action.call context, params, (err, template, data) ->
        router.stashPerf(req, "data", new Date - start)
        return router.handleErr(err, req, res) if err

        start = new Date
        viewData =
          locals: data
          app: req.rendrApp
          req: req
        res.render template, viewData, (err, html) ->
          return router.handleErr(err, req, res) if err

          # Set any headers based on route.
          res.set(router.getHeadersForRoute(routeInfo))

          res.type('html').end(html)
          router.stashPerf(req, "render", new Date - start)


  ##
  # Handle an error that happens while executing an action.
  # Could happen during the controller action, view rendering, etc.
  ##
  handleErr: (err, req, res) ->
    @stashError(req, err)
    if @config.errorHandler
      @config.errorHandler(err, req, res)
    else
      # default error handler
      if @config.dumpExceptions
        text = "Error: #{err.message}\n"
        text += "\nStack:\n #{err.stack}" if err.stack
      else
        text = "500 Internal Server Error"
      res.status(err.status || 500)
      res.type('text').send(text)


  getHeadersForRoute: (routeInfo) ->
    headers = {}
    if routeInfo.maxAge?
      headers['Cache-Control'] = "public, max-age=#{routeInfo.maxAge}"
    headers

  # stash performance metrics, if handler available
  stashPerf: (req, name, value) ->
    if @config.stashPerf?
      @config.stashPerf(req, name, value)

  # stash error, if handler available
  stashError: (req, err) ->
    if @config.stashError?
      @config.stashError(req, err)

  routes: ->
    routes = require(@config.paths.routes)
    routeSpecs = []
    for own path, routeInfo of routes
      action = @getAction(routeInfo)
      handler = @getHandler(action, routeInfo)
      routeSpecs.push(['get', "/#{path}", routeInfo.role, handler])

    routeSpecs

  # We create and reuse an instance of Express Router in '@match()'.
  _expressRouter: null

  # Return the route description based on a URL, according to the routes file.
  # This should match the way Express matches routes on the server, and our
  # ClientRouter matches routes on the client.
  match: (pathToMatch) ->
    throw new Error('Cannot match full URL: "'+pathToMatch+'". Use pathname instead.') if ~pathToMatch.indexOf('://')

    routes = require(@config.paths.routes)
    if !@_expressRouter?
      Router = require('express').Router
      @_expressRouter = new Router
      for own path, routeInfo of routes
        # Add the route to the Express router, so we can use its matching logic
        # without attempting to duplicate it.
        #
        # Ensure leading slash
        path = "/#{path}" unless path.slice(0, 1) is '/'
        @_expressRouter.route('get', path, [])

    # Ensure leading slash
    pathToMatch = "/#{pathToMatch}" unless pathToMatch.slice(0, 1) is '/'
    matchedRoute = @_expressRouter.match('get', pathToMatch)

    return null unless matchedRoute?
    routes[matchedRoute.path.slice(1)]


  # Method passed to routes file to build up routes definition.
  route: (pattern, spec) ->
