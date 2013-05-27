var server, utils, _, getApiHost;

_ = require('underscore');
utils = require('../utils');
server = require('../server');
getApiHost = require('../utils').getApiHost;

/*
 * Middleware handler for intercepting API routes.
 */
module.exports = function(apiHostsMap) {
  return function(req, res, next) {
    var api;

    api = _.pick(req, 'path', 'query', 'method', 'body');
    api.apiHost = getApiHost(api.path, apiHostsMap);

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
