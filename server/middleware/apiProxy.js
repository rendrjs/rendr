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
  return function(requestFromClient, responseToClient, next) {
    var api;

    api = _.pick(requestFromClient, 'query', 'method', 'body');

    api.path = apiProxy.getApiPath(requestFromClient.path);
    api.api = apiProxy.getApiName(requestFromClient.path);

    dataAdapter.request(requestFromClient, api, {
      convertErrorCode: false
    }, function(err, responseFromApi, body) {
      if (err) return next(err);

      // Pass through statusCode.
      responseToClient.status(responseFromApi.statusCode);
      responseToClient.json(body);
    });
  };
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
