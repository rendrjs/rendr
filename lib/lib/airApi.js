/**
  Define AirBnB Backend api's here.  
*/
var request = require('request');
var _ = require('underscore');
var url = require('url');

var config;
var logger;

/**
  Initialize AirBnB API module.  Provice config with host and key.

  config: {
    host: 'https://api.localhost.airbnb.com:3001',
    key: 'abcde'
  }
*/
module.exports.init = function(aConfig, callback) {
  config = aConfig;
  if (!config || !config.host || !config.key) {
    return callback('missing host or key config');
  }
  config.parsedUrl = url.parse(config.host);
  delete config.parsedUrl.path;
  if (!config.version) config.version = 'v1';

  if (callback) return callback();
}

/**
  Helper function to standardize api hash creation.
  - postVersionPath: for '/v1/currencies' would be '/currencies'
  - query: hash containing query parameters, eg {location:'san francisco'}
*/
function apiFor(name, postVersionPath, options) {
  var api = _.clone(config.parsedUrl);
  api.method = (options && options.method) ? options.method : 'get';
  var version = (options && options.version) ? options.version : 'v1';
  api.pathname = '/' + version + postVersionPath;
  api.query = (options && options.params) ? options.params : {};
  api.query.key = config.key;
  api.statsd = "api." + name;  // if statsd name is present, it will be logged at request
  return(api);
}


/**
  Return a hash describing all that is needed to make a search request.

  options
  - params: {location:'san francisco', locale:'en_US'}
  - version: 'v1'

  Example output:
    { method: 'get', 
      hostname: 'api.localhost.com', 
      protocol: 'http', 
      port:3000, 
      pathname: '/v1/listings/search', 
      query:{location:'san francisco', key:'abcde'}
    }
*/
module.exports.search = function(options) {
  return apiFor('search', '/listings/search', options);
}

/**
  Api for currencies
  options
  - version: 'v1'
*/
module.exports.currencies = function(options) {
  return apiFor('currencies', '/currencies', options);
}

/**
  Api for phrases
  options
  - version: 'v1'
*/
module.exports.phrases = function(options) {
  return apiFor('phrases', '/phrases/mobile_web', options);
}

/**
  Api for phrases
  options
  - version: 'v1'
*/
module.exports.locales = function(options) {
  return apiFor('locales', '/locales', options);
}

