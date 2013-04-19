_ = require('underscore')
utils = require('../utils')
server = require('../server')

# Middleware handler for intercepting API routes.
module.exports = ->
  (req, res, next) ->
    api = _.pick(req, 'path', 'query', 'method', 'body')
    server.dataAdapter.request req, api, {convertErrorCode: false}, (err, response, body) ->
      return next(err) if err
      # Pass through statusCode, but not if it's an i.e. 304.
      status = response.statusCode
      if utils.isErrorStatus(status)
        res.status(status)
      res.json(body)
