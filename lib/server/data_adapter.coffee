url = require('url')
_ = require('underscore')
airRequest = require('../lib/airRequest')
apiRouteMap = require('../config/api_route_map')

##
# Initialize AirBnB API module.  Provice config with host and key.
#
# aConfig: {
#   host: 'https://api.localhost.airbnb.com:3001',
#   key: 'abcde'
# }
##
config = null;
module.exports.init = (aConfig, callback) ->
  if !aConfig || !aConfig.host || !aConfig.key
    return callback("DataAdapter: missing host or key")
  config = aConfig
  config.parsedUrl = url.parse(config.host)
  callback()

##
# Map method, path, and params to a fully specified apiRequest
# - method: 'get', 'post', etc (default: 'get')
# - path: incoming path for now, eg: /listings.  (may need regex)
# - params: params needed for underlying api, eg: {location:'san francisco'}
#
# Example output:
#   { method: 'get',
#     hostname: 'api.localhost.com',
#     protocol: 'http',
#     port:3000,
#     pathname: '/v1/listings/search',
#     query:{location:'san francisco', key:'abcde'},
#     body: {foo: 'bar', bam: 'baz'}
#   }
##
requestFor = (req) ->
  api = _.clone config.parsedUrl
  api.method = req.method || 'get'
  pathname = req.url.split('?')[0]
  apiConfig = apiRouteMap[pathname] || {apiPath:pathname}
  api.pathname = '/v1' + apiConfig.apiPath
  api.query = req.query || {}
  api.query.key = config.key

  if req.appContext
    access_token = req.appContext.SessionManager.get('access_token')
    if access_token
      api.query.oauth_token = access_token
  api.body = req.body
  api.statsd = "api." + apiConfig.statsd if apiConfig.statsd
  api

##
# Make backend api request as specified by our server route (method/path/params)
##
module.exports.makeRequest = (req, callback) ->
  apiRequest = requestFor(req)
  airRequest.makeJSONRequest apiRequest, (err, response, body) ->
    return callback(err) if err
    callback(null, response, body)

