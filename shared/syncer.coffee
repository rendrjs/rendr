server = require('../server/server') if global.isServer
qs = require('qs') if global.isServer

methodMap =
  'create': 'POST'
  'update': 'PUT'
  'delete': 'DELETE'
  'read':   'GET'

clientSync = (method, model, options) ->
  options.url = @getUrl(options.url, true)
  Backbone.emulateJSON = true
  options.data = addApiParams(method, model, options.data)
  Backbone.sync(method, model, options)

serverSync = (method, model, options) ->
  options.url = @getUrl(options.url)
  verb = methodMap[method]
  urlParts = options.url.split('?')
  req =
    method: verb
    path: urlParts[0]
    appContext: model.app
    query: qs.parse(urlParts[1]) || {}

  # Put the data as form data if POST or PUT,
  # otherwise query string.
  if verb is 'POST' or verb is 'PUT'
    req.json = options.data
  else
    _.extend req.query, options.data

  server.dataAdapter.makeRequest req, (err, response, body) ->
    err ||= getErrForResponse(response)

    if err
      if options.error
        options.error(model, body, options)
      else
        throw err
    else
      # This `success` has signature of $.ajax, not Backbone.sync.
      options.success(body)

# Convert 4xx, 5xx responses to be errors.
getErrForResponse = (res) ->
  statusCode = +res.statusCode
  err = null
  if isErrorStatus(statusCode)
    err = new Error("#{statusCode} status")
    err.statusCode = statusCode
    err.body = res.body
  err

isErrorStatus = (statusCode) ->
  statusCode = +statusCode
  statusCode >= 400 and statusCode < 600

# We want to always add the
addApiParams = (method, model, params = {}) ->
  app = model.app
  ret = _.extend {}, params,
    locale:       app.State.get('locale')
    currency:     app.State.get('currency')

  # So, by default Backbone sends all of the model's
  # attributes if we don't pass any in explicitly.
  # This gets screwed up because we append the locale
  # and currency, so let's replicate that behavior.
  if model and _.isEqual(params, {}) and (method is 'create' or method is 'udpate')
    _.extend ret, model.toJSON()

  ret

exports.getSync = ->
  if isServer
    serverSync
  else
    clientSync

# 'model' is either a model or collection that
# has a 'url' property, which can be a string or function.
exports.getUrl = (url = null, clientPrefix = false) ->
  url ||= _.result(@, 'url')
  url = "/api#{url}" if clientPrefix
  interpolateParams(@, url)

extractParamNamesRe = /:(\w+)/g

# This maps i.e. '/listings/:id' to '/listings/3' if
# the model you supply has model.get('id') == 3.
exports.interpolateParams = interpolateParams = (model, url) ->
  matches = url.match(extractParamNamesRe)
  if matches
    matches.forEach (param) ->
      property = param.slice(1)
      # Is collection? Then use options.
      if model.length?
        value = model.options[property]
      # Otherwise it's a model; use attrs.
      else
        value = model.get(property)
      url = url.replace(param, value)
  url
