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
getHandler = (action) ->
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
      res.render template, locals: data, app: req.rendrApp, req: req, (err, html) ->
        # TODO! consider setting pragma-no-cache headers based on route!
        if (err)
          console.log("RENDER ERROR", err)
        return handleErr(err, req, res) if err
        res.type('html')
        res.end(html)
        utils.stashPerf(req, "render", new Date - start)

handleErr = (err, req, res) ->
  utils.stashError(req, err)

  if err.statusCode && err.statusCode is 401
    res.redirect('/login')
  else
    if (env.name == 'development')
      throw err
    else
      res.render('error_view', app: req.rendrApp, req: req)

# define routes
exports.routes = () ->
  routeSpecs = []
  for own path, routeInfo of routes
    action = getAction(routeInfo)
    handler = getHandler(action)
    routeSpecs.push(['get', "/#{path}", routeInfo.role, handler])

  routeSpecs
