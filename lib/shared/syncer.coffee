dataAdapter = require('../server/data_adapter') if global.isServer

methodMap =
  'create': 'POST'
  'update': 'PUT'
  'delete': 'DELETE'
  'read':   'GET'

clientSync = (method, model, options) ->
  url = getUrl(model, options.url)
  options.url = "/api#{url}"
  Backbone.emulateJSON = true
  options.data = addApiParams(method, model, options.data)
  Backbone.sync(method, model, options)

serverSync = (method, model, options) ->
  options.url = getUrl(model, options.url)
  verb = methodMap[method]
  req =
    method: verb
    url: options.url
    appContext: model.app

  # Put the data as form data if POST or PUT,
  # otherwise query string.
  if verb is 'POST' or verb is 'PUT'
    req.body = options.data
  else
    req.query = options.data

  dataAdapter.makeRequest req, (err, res, json) ->
    err ||= getErrForResponse(res)

    if err
      if options.error
        options.error(err)
      else
        throw err
    else
      options.success(json)

# Convert 4xx, 5xx responses to be errors.
getErrForResponse = (res) ->
  statusCode = +res.statusCode
  err = null
  if statusCode >= 400 and statusCode < 600
    err = new Error("#{statusCode} status")
    err.statusCode = statusCode
    err.body = res.body
  err

# We want to always add the
addApiParams = (method, model, params = {}) ->
  app = model.app
  ret = _.extend {}, params,
    locale:       app.State.get('locale')
    currency:     app.State.get('currency')
  # oauth_token = app.SessionManager.get('access_token')
  # ret.oauth_token = oauth_token if oauth_token?

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
getUrl = (model, url) ->
  if !url
    url = _.result(model, 'url')
  interpolateParams(model, url)

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
