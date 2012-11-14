# Functions for getting Controllers and Actions.
env = require('../config/environments/env')
paths = env.paths
routes = require(paths.entryPath + '/routes')

# given a name, eg "listings#show"
# return function that matches that controller's action (eg the show method of the listings controller)
getAction = (config) ->
  controller = getController(config.controller);
  controller[config.action]

getController = (controllerName) ->
  require(paths.entryPath + "/controllers/#{controllerName}_controller")

getHandler = (action) ->
  (req, res, next) ->
    context =
      app: req.appContext
      redirectTo: (url) -> res.redirect(url)

    params = req.query || {}
    req.route.keys.forEach (routeKey) ->
      params[routeKey.name] = req.route.params[routeKey.name]

    action.call context, params, (err, template, data) ->
      return handleErr(err, req, res) if err
      res.render(template, locals: data, app: req.appContext, req: req)

handleErr = (err, req, res) ->
  # stash rndr in request for propper middleware logging
  if (!req.rndr)
    req.rndr = {}
  req.rndr.err = err

  if err.statusCode && err.statusCode is 401
    res.redirect('/login')
  else
    if (env.name == 'development')
      throw err
    else
      error_message = "We're sorry, something went wrong..." # todo: must be standardized/internationalized
      res.render('error_view', locals: {error_message: error_message}, app: req.appContext, req: req);

getAuthenticate = (routeInfo) ->
  (req, res, next) ->
    if routeInfo.authenticated && !req.appContext.loggedIn()
      res.redirect('/login')
    else
      next()

# Attach our routes to our server
exports.buildRoutes = (server) ->
  routeSummary = []
  for own path, routeInfo of routes
    action = getAction(routeInfo)
    handler = getHandler(action)
    authenticate = getAuthenticate(routeInfo)

    routeSummary.push("get /#{path}")
    server.get("/#{path}", authenticate, handler)

  routeSummary
