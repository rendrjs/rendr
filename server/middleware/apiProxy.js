var server, utils, Backbone, _;

_ = require('underscore');
Backbone = require('backbone');
utils = require('../utils');
server = require('../server');

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

function getApiHost(path, apiHostsMap) {
  var extractParamNamesRe = /:(\w+)/g,
      apiHost = null;

  _.each( apiHostsMap, function(urls, host) {
    _.each(urls, function(url) {
      url = url.substring(0, url.indexOf('?')) || url,
      r = Backbone.Router.prototype._routeToRegExp(url);
      if (r.exec(path)){ return (apiHost = host); }
    });
  });

  return apiHost;
}