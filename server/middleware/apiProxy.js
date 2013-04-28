var server, utils, _;

_ = require('underscore');
utils = require('../utils');
server = require('../server');

/*
 * Middleware handler for intercepting API routes.
 */
module.exports = function() {
  return function(req, res, next) {
    var api;

    api = _.pick(req, 'path', 'query', 'method', 'body');
    server.dataAdapter.request(req, api, {
      convertErrorCode: false
    }, function(err, response, body) {
      var status;

      if (err) return next(err);

      // Pass through statusCode, but not if it's an i.e. 304.
      status = response.statusCode;
      if (utils.isErrorStatus(status)) {
        res.status(status);
      }
      res.json(body);
    });
  };
};
