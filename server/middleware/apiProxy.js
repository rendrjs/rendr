var _ = require('underscore');

/**
 * The separator used in the path. Incoming paths can look like:
 *   /-/path/to/resource
 *   /api-name/-/path/to/resource
 */
var separator = '/-/';

/**
 * Middleware handler for intercepting API routes.
 */
module.exports = apiProxy;

function apiProxy(dataAdapter) {
  var middleware = function(req, res, next) {
    var api;

    api = _.pick(req, 'query', 'method', 'body');

    api.path = apiProxy.getApiPath(req.path);
    api.api = apiProxy.getApiName(req.path);

    middleware.proxyRequest(req, res, api, { convertErrorCode: false }, function(err, response, body) {
      if (err) return next(err);

      // Pass through statusCode.
      res.status(response.statusCode);
      res.json(body);
    });
  };

  middleware.proxyRequest = function proxyRequest(req, res, api, options, callback) {
    api.headers = api.headers || {};
    api.headers['x-forwarded-for'] = apiProxy.getXForwardedForHeader(req.headers, req.ip);

    dataAdapter.request(req, api, options, callback);
  };

  return middleware;
};

apiProxy.getApiPath = function getApiPath(path) {
  var sepIndex = path.indexOf(separator),
      substrIndex = sepIndex === -1 ? 0 : sepIndex + separator.length - 1;
  return path.substr(substrIndex);
};

apiProxy.getApiName = function getApiName(path) {
  var sepIndex = path.indexOf(separator),
      apiName = null;
  if (sepIndex > 0) {
    apiName = path.substr(1, sepIndex - 1);
  }
  return apiName;
};

apiProxy.getXForwardedForHeader = function (headers, clientIp) {
  var existingHeader = headers['x-forwarded-for'],
      newHeaderValue = clientIp;

  if (existingHeader) {
    newHeaderValue = existingHeader + ', ' + clientIp;
  }

  return newHeaderValue;
};
