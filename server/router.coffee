BaseRouter = require('../shared/base/router')
sanitize = require('validator').sanitize

module.exports = class ServerRouter extends BaseRouter

  escapeParams: (params) ->
    escaped = {}
    for own key, value of params
      escaped[key] = sanitize(value).xss()
    escaped

  # This is the method that renders the request.
  getHandler: (action, pattern, route) ->
    router = @

    (req, res, next) ->
      app = req.rendrApp
      context =
        currentRoute: route
        app: app
        redirectTo: (url) -> res.redirect(url)

      params = req.query || {}
      req.route.keys.forEach (routeKey) ->
        params[routeKey.name] = req.route.params[routeKey.name]
      params = router.escapeParams(params)

      action.call context, params, (err, template, locals) ->
        return router.handleErr(err, req, res) if err

        viewData = {locals, app, req}
        res.render template, viewData, (err, html) ->
          return router.handleErr(err, req, res) if err

          # Set any headers based on route.
          res.set(router.getHeadersForRoute(route))

          res.type('html').end(html)


  ##
  # Handle an error that happens while executing an action.
  # Could happen during the controller action, view rendering, etc.
  ##
  handleErr: (err, req, res) ->
    @stashError(req, err)
    if @options.errorHandler
      @options.errorHandler(err, req, res)
    else
      # default error handler
      if @options.dumpExceptions
        text = "Error: #{err.message}\n"
        text += "\nStack:\n #{err.stack}" if err.stack
      else
        text = "500 Internal Server Error"
      res.status(err.status || 500)
      res.type('text').send(text)


  getHeadersForRoute: (definition) ->
    headers = {}
    if definition.maxAge?
      headers['Cache-Control'] = "public, max-age=#{definition.maxAge}"
    headers

  # stash error, if handler available
  stashError: (req, err) ->
    if @options.stashError?
      @options.stashError(req, err)

  # We create and reuse an instance of Express Router in '@match()'.
  _expressRouter: null

  # Return the route definition based on a URL, according to the routes file.
  # This should match the way Express matches routes on the server, and our
  # ClientRouter matches routes on the client.
  match: (pathToMatch) ->
    throw new Error('Cannot match full URL: "'+pathToMatch+'". Use pathname instead.') if ~pathToMatch.indexOf('://')

    routes = @routes()
    routesByPath = {}

    # NOTE: Potential here to cache this work. Must invalidate when additional
    # routes are added.
    Router = require('express').Router
    @_expressRouter = new Router
    for route in routes
      # Add the route to the Express router, so we can use its matching logic
      # without attempting to duplicate it.
      #
      # Ensure leading slash
      path = route[0]
      @_expressRouter.route('get', path, [])
      routesByPath[path] = route

    # Ensure leading slash
    pathToMatch = "/#{pathToMatch}" unless pathToMatch.slice(0, 1) is '/'
    matchedRoute = @_expressRouter.match('get', pathToMatch)

    return null unless matchedRoute?
    routesByPath[matchedRoute.path]
