var server, utils, _;

_ = require('underscore');
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
      r = routeToRegExp(url);

      if (r.exec(path)){
        return (apiHost = host);
      }

    });
  });

  return apiHost;
}

// Duping some of BB's routing logic here to ensure we have a good match
function routeToRegExp( route ) {
  var optionalParam = /\((.*?)\)/g,
      namedParam    = /(\(\?)?:\w+/g,
      splatParam    = /\*\w+/g,
      escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  route = route.replace(escapeRegExp, '\\$&')
               .replace(optionalParam, '(?:$1)?')
               .replace(namedParam, function(match, optional){
                 return optional ? match : '([^\/]+)';
               })
               .replace(splatParam, '(.*?)');

  return new RegExp('^' + route + '$');
}

function extractParameters ( route, fragment ) {
  var params = route.exec(fragment).slice(1);
  return _.map(params, function(param) {
    return param ? decodeURIComponent(param) : null;
  });
}