# Functions for getting Controllers and Actions.
env = require('../config/environments/env')
paths = env.paths
routes = require(paths.entryPath + '/routes')

config = null;

stashPerf = (req, name, value) ->
  if (config && config.stashPerf)
    config.stashPerf(req, name, value)

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
      app: req.rendrApp
      redirectTo: (url) -> res.redirect(url)

    params = req.query || {}
    req.route.keys.forEach (routeKey) ->
      params[routeKey.name] = req.route.params[routeKey.name]

    start = new Date;
    action.call context, params, (err, template, data) ->
      stashPerf(req, "data", new Date - start)
      return handleErr(err, req, res) if err

      start = new Date;
      res.render template, locals: data, app: req.rendrApp, req: req, (err, html) ->
        # TODO! consider setting pragma-no-cache headers based on route!
        if (err)
          console.log("RENDER ERROR", err)
        return handleErr(err, req, res) if err
        res.end(html)
        stashPerf(req, "render", new Date - start)
        next()


handleErr = (err, req, res) ->
  if (config && config.stashError)
    config.stashError(req, err)

  if err.statusCode && err.statusCode is 401
    res.redirect('/login')
  else
    if (env.name == 'development')
      throw err
    else
      res.render('error_view', app: req.rendrApp, req: req);
      next()

getAuthenticate = (routeInfo) ->
  (req, res, next) ->
    start = new Date;
    if routeInfo.authenticated && !req.rendrApp.loggedIn()
      res.redirect('/login')
    else
      stashPerf(req, "authenticate", new Date - start)
      next()

afterRender = () ->
  (req, res, next) ->
    if (config && config.afterRender)
      config.afterRender(req, res)
    # DO NOT CALL NEXT!  END FILTER CHAIN HERE

# config
# - stashError(req, err)
# - stashPerf(req, name, runtime)
exports.init = (conf) ->
  config = conf


# define routes
exports.routes = () ->
  routeSpecs = []
  for own path, routeInfo of routes
    action = getAction(routeInfo)
    handler = getHandler(action)
    authenticate = getAuthenticate(routeInfo)
    routeSpecs.push(['get', "/#{path}", authenticate, handler, afterRender()])

  routeSpecs
