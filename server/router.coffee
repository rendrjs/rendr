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
      viewData =
        locals: data
        app: req.rendrApp
        req: req
      res.render template, viewData, (err, html) ->
        return handleErr(err, req, res) if err
        res.type('html').end(html)
        utils.stashPerf(req, "render", new Date - start)

handleErr = (err, req, res) ->
  utils.stashError(req, err)

  if err.status && err.status is 401
    res.redirect('/login')
  else
    data =
      app: req.rendrApp
      req: req
    if env.name == 'development'
      data.locals =
        message: err.message
        stack: err.stack
    res.status(err.status || 500)
    res.render('error_view', data)

# define routes
exports.routes = () ->
  routeSpecs = []
  for own path, routeInfo of routes
    action = getAction(routeInfo)
    handler = getHandler(action)
    routeSpecs.push(['get', "/#{path}", routeInfo.role, handler])

  routeSpecs
