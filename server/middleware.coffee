logger = require('./lib/logger')
async = require('async')
App = require(rendr.entryPath + '/app')

# start request timer
exports.startRequest = ->
  return (req, res, next) ->
    req.start = new Date
    req.requestId = 0 # think up something a little more unique
    next()

exports.logline = (err, req, res) ->
  runtime = new Date - req.start
  userId = 0
  requestId = 0
  maskedUrl = req.originalUrl.replace /password=[^&?]*/g, "password=***"
  clientIP = req.headers['client_ip'] || req.connection.remoteAddress  || 'unknown'
  info = ["MOWEB:[#{requestId}]"];
  info.push clientIP
  info.push userId
  info.push '"' + req.method + ' ' + maskedUrl + ' ' + req.httpVersion + '"'
  info.push res.statusCode
  #length = res.body ? res.body.length : 0
  info.push "#{runtime}ms"

  # if (err && err.stack) {
  #   logger.fatal(info.join(' ') + err.stack);
  # } else if (err) {
  #   logger.error(info.join(' '));
  # } else {
  #   logger.info(info.join(' '));
  # }
  logger.info info.join ' '

exports.createAppInstance = ->
  (req, res, next) ->
    req.appContext = new App
    next()

exports.getAccessToken = ->
  (req, res, next) ->
    # access_token = req.cookies.access_token
    # if access_token
    #   req.appContext.SessionManager.set {access_token}
    next()
