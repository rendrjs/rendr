/**
  Central place to make requests to backend api's
*/
var request = require('request');
var _ = require('underscore');
var url = require('url');

var config = {
  logPrefix: 'MOWEB.AIRAPI'
}
var logger;
var statsd;

/**
  Initialize AirBnB Request module.  Provice config with host and key.

  options: {
    - logPrefix: "MOWEB.AIRAPI"
  }
*/
module.exports.init = function(options, aLogger, aStatsd, callback) {
  if (options) _.extend(config, options);

  // initialize request
  // var requestDefaults = {jar:false, timetout: 1000, agent:false};
  // request = request.defaults(requestDefaults);

  logger = aLogger;
  statsd = aStatsd;
  if (logger) logger.debug("request init")

  return callback();
}


/**
  Log all request/response to log
*/
function logResponse(method, requestUrl, err, response, runtime, options) {
  if (logger) {
    var info = [config.logPrefix];
    if (options && options.requestId) {
      info.push("[" + options.requestId + "]");
    }
    info.push(":");
    info.push(method.toUpperCase());
    if (requestUrl) info.push(requestUrl);
    if (response) info.push(response.statusCode || '?')
    if (runtime) info.push(runtime + 'ms');

    if (err || (response.statusCode && response.statusCode >= 400)) {
      if (err) info.push('ERROR=' + err);
      logger.error(info.join(' '));
    } else {
      logger.info(info.join(' '));
    }
  }
}


/**
  Make request given api.
  - api:  either string, or a hash that describes request such as
          {method: 'get', pathname: '/v1/listings/search', query:{location:'san francisco'}}
  - options
    - requestId:  request id for logging
    - parseJSON: true/false.  If true, parse the json body
  - callback(err, request, body)
*/
var makeRequest = module.exports.makeRequest = function(apiOrUrl, options, callback) {
  var requestUrl,
      method = 'get';
  if (apiOrUrl instanceof String) {
    requestUrl = apiOrUrl;
  } else {
    requestUrl = url.format(apiOrUrl);
    if (apiOrUrl.method) {
      method = apiOrUrl.method.toLowerCase();
    }
  }
  var startTime = new Date();

  if (method === 'get' || method === 'delete') {
    request[method](requestUrl, reqCallback);
  } else {
    // Pass form data.
    request[method](requestUrl, {form: apiOrUrl.body}, reqCallback);
  }

  function reqCallback(err, response, body) {
    var runtime = ((new Date()) - 1.0*startTime);
    if (options && options.parseJSON) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        err = e;
      }
    }

    // Log some stuff
    logResponse(method, requestUrl, err, response, runtime, options);

    // Statsd
    if (statsd && apiOrUrl.statsd) {
      statsd.timing(apiOrUrl.statsd, runtime);
    }

    // Callback
    callback(err, response, body);
  }
}

module.exports.makeJSONRequest = function(apiOrUrl, callback) {
  makeRequest(apiOrUrl, {parseJSON:true}, callback);
}
