# Functions for getting Controllers and Actions.

config = null

# - conf
#   - errorHandler: function to correctly handle error
#   - paths
#     - entryPath (required)
#     - routes (optional)
#     - controllerDir (optional)
#   - stashPerf: optional function to store performance stats
#   - stashError: optional function to notify server of error
#
exports.init = (conf, callback) ->
  config = conf
  if (!config.paths || !config.paths.entryPath)
    return callback(new Error("Missing entryPath"))
  config.paths.routes ||= config.paths.entryPath + '/routes'
  config.paths.controllerDir ||= config.paths.entryPath + '/controllers'
  callback()


# stash performance metrics, if handler available
stashPerf = (req, name, value) ->
  if (config && config.stashPerf)
    config.stashPerf(req, name, value)

# stash error, if handler available
stashError = (req, err) ->
  if (config && config.stashError)
    config.stashError(req, err)


getController = (controllerName) ->
  require("#{config.paths.controllerDir}/#{controllerName}_controller")

# given a name, eg "listings#show"
# return function that matches that controller's action (eg the show method of the listings controller)
getAction = (config) ->
  controller = getController(config.controller)
  controller[config.action]


# this is the method that renders the request
getHandler = (action, routeInfo) ->
  (req, res, next) ->
    context =
      app: req.rendrApp
      redirectTo: (url) -> res.redirect(url)

    params = req.query || {}
    req.route.keys.forEach (routeKey) ->
      params[routeKey.name] = req.route.params[routeKey.name]

    start = new Date
    action.call context, params, (err, template, data) ->
      stashPerf(req, "data", new Date - start)
      return handleErr(err, req, res) if err

      start = new Date
      viewData =
        locals: data
        app: req.rendrApp
        req: req
      res.render template, viewData, (err, html) ->
        return handleErr(err, req, res) if err

        # Set any headers based on route.
        res.set(getHeadersForRoute(routeInfo))

        res.type('html').end(html)
        stashPerf(req, "render", new Date - start)

getHeadersForRoute = (routeInfo) ->
  headers = {}

  if routeInfo.maxAge?
    headers['Cache-Control'] = "public, max-age=#{routeInfo.maxAge}"

  headers

##
# Handle an error that happens while executing an action.
# Could happen during the controller action, view rendering, etc.
##
handleErr = (err, req, res) ->
  stashError(req, err)
  if (config && config.errorHandler)
    config.errorHandler(err, req, res)
  else
    # default error handler
    if (config && config.dumpExceptions)
      text = "Error: #{err.message}\n"
      text += "\nStack:\n #{err.stack}" if err.stack
    else
      text = "500 Internal Server Error"
    res.status(err.status || 500)
    res.type('text').send(text)


# define routes
exports.routes = () ->
  routes = require(config.paths.routes)
  routeSpecs = []
  for own path, routeInfo of routes
    action = getAction(routeInfo)
    handler = getHandler(action, routeInfo)
    routeSpecs.push(['get', "/#{path}", routeInfo.role, handler])

  routeSpecs

# Return the route description based on a URL, according to the routes file.
# This should match the way Express matches routes on the server, and our
# ClientRouter matches routes on the client.
#
# We hoist these variables because this router is a singleton at the moment.
# Good reason to change it to become a class.
expressRouter = null
exports.match = (pathToMatch) ->
  throw new Error('Cannot match full URL: "'+pathToMatch+'". Use pathname instead.') if ~pathToMatch.indexOf('://')

  routes = require(config.paths.routes)
  if !expressRouter?
    Router = require('express').Router
    expressRouter = new Router
    for own path, routeInfo of routes
      # Add the route to the Express router, so we can use its matching logic
      # without attempting to duplicate it.
      #
      # Ensure leading slash
      path = "/#{path}" unless path.slice(0, 1) is '/'
      expressRouter.route('get', path, [])

  # Ensure leading slash
  pathToMatch = "/#{pathToMatch}" unless pathToMatch.slice(0, 1) is '/'
  matchedRoute = expressRouter.match('get', pathToMatch)

  return null unless matchedRoute?
  routes[matchedRoute.path.slice(1)]

