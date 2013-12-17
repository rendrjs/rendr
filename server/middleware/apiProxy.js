var _ = require('underscore');

/**
 * The separator used in the path. Incoming paths can look like:
 *   /-/path/to/resource
 *   /api-name/-/path/to/resource
 */
var separator = '/-/';

function getApiCookiePrefix(apiName) {
  return (apiName || 'default') + separator
}

function extractCookiesForApi(req, apiName) {
  var apiCookiePrefix = getApiCookiePrefix(apiName),
    incomingCookies = (req.get('cookie') || '').split('; ');

  return incomingCookies
    .filter(function (cookie) {
      return apiCookiePrefix === cookie.substr(0, apiCookiePrefix.length);
    })
    .map(function (cookie) {
      return cookie.substr(apiCookiePrefix.length);
    });
}

function prefixSetCookieHeaderWithApiName(responseFromApi, api) {
  var outgoingCookies = responseFromApi.headers['set-cookie'] || [],
    apiCookiePrefix = getApiCookiePrefix(api.api);

  return outgoingCookies.map(function (cookie) {
    return apiCookiePrefix + cookie;
  });
}

/**
 * Middleware handler for intercepting API routes.
 */
module.exports = apiProxy;

function apiProxy(dataAdapter) {
  return function(req, res, next) {
    var api;

    api = _.pick(req, 'query', 'method', 'body');

    api.path = apiProxy.getApiPath(req.path);
    api.api = apiProxy.getApiName(req.path);
    api.headers = {cookie: extractCookiesForApi(req, api.api)};

    dataAdapter.request(req, api, {
      convertErrorCode: false
    }, function(err, response, body) {
      if (err) return next(err);

      res.status(response.statusCode);
      res.setHeader('set-cookie', prefixSetCookieHeaderWithApiName(response, api));
      res.json(body);
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
