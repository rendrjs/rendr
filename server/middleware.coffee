logger = require('./lib/logger')
async = require('async')
App = require(rendr.entryPath + '/app')

##
# Wrap the request -- set the timer at the beginning, and log at the end
# Optionally call additional after-render functionality
#
exports.responseWrapper = ->
  return (req, res, next) ->
    req.rndr = {} # place to stash
    req.rndr.start = new Date
    req.rndr.requestId = 0
    end = res.end;
    res.end = (chunk, encoding) ->
      res.end = end;
      res.end(chunk, encoding);

      req.rndr.runtime = new Date - req.rndr.start
      logger.logRequest(req, res, req.rndr)
      if (afterRender)
        afterRender(req, res)

    next()

afterRender = null;
exports.setAfterRender = (arhFunction) ->
  afterRender = arhFunction;


exports.createAppInstance = ->
  (req, res, next) ->
    req.appContext = new App
    next()
