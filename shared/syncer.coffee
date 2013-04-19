qs = require('qs') if global.isServer
modelUtils = null
server = null

methodMap =
  'create': 'POST'
  'update': 'PUT'
  'delete': 'DELETE'
  'read':   'GET'

clientSync = (method, model, options) ->
  data = _.clone options.data
  options.url = @getUrl(options.url, true, data)
  data = addApiParams(method, model, data)
  options.data = data
  options.emulateJSON = true
  Backbone.sync(method, model, options)

serverSync = (method, model, options) ->
  data = _.clone options.data
  options.url = @getUrl(options.url, false, data)
  verb = methodMap[method]
  urlParts = options.url.split('?')
  api =
    method: verb
    path: urlParts[0]
    query: qs.parse(urlParts[1]) || {}
    body: {}

  # Put the data as form data if POST or PUT,
  # otherwise query string.
  if verb is 'POST' or verb is 'PUT'
    api.body = data
  else
    _.extend api.query, data

  server ?= require('../server/server')
  server.dataAdapter.request @app.req, api, (err, response, body) ->
    if err
      body = {body} if !_.isObject(body)
      # Pass through the statusCode, so lower-level code can handle i.e. 401 properly.
      body.status = err.status
      if options.error
        # This `error` has signature of $.ajax, not Backbone.sync.
        options.error(body)
      else
        throw err
    else
      # This `success` has signature of $.ajax, not Backbone.sync.
      options.success(body)

# We want to always add the
addApiParams = (method, model, params = {}) ->
  ret = _.clone params

  # So, by default Backbone sends all of the model's
  # attributes if we don't pass any in explicitly.
  # This gets screwed up because we append the locale
  # and currency, so let's replicate that behavior.
  if model and _.isEqual(params, {}) and (method is 'create' or method is 'update')
    _.extend ret, model.toJSON()

  ret

exports.getSync = ->
  if global.isServer
    serverSync
  else
    clientSync

# 'model' is either a model or collection that
# has a 'url' property, which can be a string or function.
exports.getUrl = (url = null, clientPrefix = false, params = {}) ->
  url ||= _.result(@, 'url')
  url = "/api#{url}" if clientPrefix
  interpolateParams(@, url, params)


# This is used to fire off a 'fetch', compare the results to the data we have,
# and then trigger a 'refresh' event if the data has changed.
#
# Happens only client-side.
exports.checkFresh = ->
  # Lame: have to lazy-require to prevent circular dependency.
  modelUtils ||= require('./modelUtils')

  @app?.trigger 'checkFresh:start'

  url = @getUrl(null, true)
  $.getJSON url, @params, (resp) =>
    # The second argument 'false' tells 'parse()' not to modify the instance.
    data = @parse(resp, false)
    differs = objectsDiffer(data, @toJSON())

    @app?.trigger 'checkFresh:end', differs

    if differs
      if modelUtils.isModel(@)
        @set(data, silent: true)
      else
        @reset(data, parse: true, silent: true)
      # We manually store the updated data.
      @store()
      @trigger 'refresh'

objectsDiffer = exports.objectsDiffer = (data1, data2) ->
  changed = false

  keys = _.unique _.keys(data1).concat(_.keys(data2))
  for key in keys
    value1 = data1[key]
    value2 = data2[key]

    # If attribute is an object recurse
    if _.isObject(value1) and _.isObject(value2)
      changed = objectsDiffer(value1, value2)

    # Test for equality
    else if !_.isEqual(value1, value2)
      changed = true

  changed

extractParamNamesRe = /:(\w+)/g

# This maps i.e. '/listings/:id' to '/listings/3' if
# the model you supply has model.get('id') == 3.
exports.interpolateParams = interpolateParams = (model, url, params = {}) ->
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
      # Delete the param from params hash, so we don't get urls like:
      #   /v1/threads/1234?id=1234...
      delete params[property]
  url
