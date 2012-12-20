# Functions for getting Controllers and Actions.
env = require('../config/environments/env')
paths = env.paths
routes = require(paths.entryPath + '/routes')
utils = require('./utils')

# given a name, eg "listings#show"
# return function that matches that controller's action (eg the show method of the listings controller)
getAction = (config) ->
  controller = getController(config.controller)
  controller[config.action]

getController = (controllerName) ->
  require(paths.entryPath + "/controllers/#{controllerName}_controller")

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
      utils.stashPerf(req, "data", new Date - start)
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
        utils.stashPerf(req, "render", new Date - start)

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
  utils.stashError(req, err)

  handler = exports.errorHandler || defaultErrorHandler
  handler(err, req, res)

##
# Define a default error handler.
##
defaultErrorHandler = (err, req, res) ->
  if env.current.errorHandler?.dumpExceptions
    text = "Error: #{err.message}\n"
    text += "\nStack:\n #{err.stack}" if err.stack
  else
    text = "500 Internal Server Error"
  res.status(err.status || 500)
  res.type('text').send(text)

# define routes
exports.routes = () ->
  routeSpecs = []
  for own path, routeInfo of routes
    action = getAction(routeInfo)
    handler = getHandler(action, routeInfo)
    routeSpecs.push(['get', "/#{path}", routeInfo.role, handler])

  routeSpecs
