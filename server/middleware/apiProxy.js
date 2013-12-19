var _ = require('underscore');

/**
 * The separator used in the path. Incoming paths can look like:
 *   /-/path/to/resource
 *   /api-name/-/path/to/resource
 */
var separator = '/-/';

function getApiCookiePrefix(apiName) {
  return (apiName || 'default') + separator;
}

function extractCookieName(cookieString) {
  return cookieString.split('=').shift();
}

function extractCookieValue(cookieString) {
  return cookieString.split('=').pop();
}

function extractCookiesForApi(req, apiName) {
  var rawCookieString = req.get('cookie') || '',
    apiCookies = rawCookieString.split('; '),
    apiCookiePrefix = getApiCookiePrefix(apiName);

  return apiCookies
    .filter(function (cookie) {
      var cookieName = extractCookieName(cookie);
      return cookieName.indexOf(apiCookiePrefix) === 0;
    })
    .map(function (cookie) {
      return decodeURIComponent(extractCookieValue(cookie));
    });
};

function encodeApiCookies(responseFromApi, apiName) {
  var apiCookiePrefix = getApiCookiePrefix(apiName),
    setCookieHeaders = [];

  if (responseFromApi.headers && responseFromApi.headers['set-cookie']) {
    setCookieHeaders = responseFromApi.headers['set-cookie'];
  }

  return setCookieHeaders.map(function (setCookieHeader) {
    var cookieName = apiCookiePrefix + extractCookieName(setCookieHeader),
      cookieValue = encodeURIComponent(setCookieHeader);

    return cookieName + '=' + cookieValue;
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
      res.setHeader('set-cookie', encodeApiCookies(response, api.api));
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
