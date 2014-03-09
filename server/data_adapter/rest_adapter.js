var DataAdapter = require('./index'),
    utils = require('../utils'),
    _ = require('underscore'),
    url = require('url'),
    request,
    debug = require('debug')('rendr:RestAdapter'),
    util = require('util');

module.exports = RestAdapter;

function RestAdapter(options) {
  DataAdapter.call(this, options);

  /**
   * Default options.
   */
  _.defaults(this.options, {
    userAgent: 'Rendr RestAdapter; Node.js'
  });

  request = this.options.request || require('request');
}

util.inherits(RestAdapter, DataAdapter);

/**
 * `request`
 *
 * This is method that Rendr calls to ask for data. In this case, we override
 * it to speak basic REST using HTTP & JSON. This is good for consuming an
 * existing RESTful API that exists externally to your Node app.
 *
 * `req`: Actual request object from Express/Connect.
 * `api`: Object describing API call; properties including 'path', 'query', etc.
 *        Passed to `url.format()`.
 * `options`: (optional) Options.
 * `callback`: Callback.
 */
RestAdapter.prototype.request = function(req, api, options, callback) {

  /**
   * Allow for either 3 or 4 arguments; `options` is optional.
   */
  if (arguments.length === 3) {
    callback = options;
    options = {};
  }

  /**
   * Do a shallow copy of options, and provide some default values.
   */
  options = _.defaults({}, options, {
    convertErrorCode: true,
    allow4xx: false
  });

  /**
   * Get defaults for the `api` object.
   */
  api = this.apiDefaults(api, req);

  /**
   * Request timing.
   */
  var start = new Date().getTime(),
      end;

  /**
   * Make the request. The `api` object is passed into the `request` library.
   */
  request(api, function(err, response, body) {
    if (err) return callback(err);

    end = new Date().getTime();

    debug('%s %s %s %sms', api.method.toUpperCase(), api.url, response.statusCode, end - start);

    /**
     * If specified by options, convert an i.e. 5xx HTTP response to an error.
     */
    if (options.convertErrorCode) {
      err = this.getErrForResponse(response, {allow4xx: options.allow4xx});
    }

    /**
     * Attempt to parse as JSON, if it looks like JSON.
     */
    if (typeof body === 'string' && this.isJSONResponse(response)) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        err = e;
      }
    }

    callback(err, response, body);
  }.bind(this));
};

RestAdapter.prototype.isJSONResponse = function(response) {
  var contentType = response.headers['content-type'] || '';
  return contentType.indexOf('application/json') !== -1;
};

RestAdapter.prototype.apiDefaults = function(api, req) {
  var urlOpts, apiHost;

  api = _.clone(api);

  // If path contains a protocol, assume it's a URL.
  if (api.path && ~api.path.indexOf('://')) {
    api.url = url.format({ pathname: api.path, query: api.query });
    delete api.path;
  }

  // Can specify a particular API to use, falling back to default.
  apiHost = this.options[api.api] || this.options['default'] || this.options;

  urlOpts = _.defaults(
    _.pick(api,     ['protocol', 'port', 'query']),
    _.pick(apiHost, ['protocol', 'port', 'host'])
  );
  urlOpts.pathname = api.path || api.pathname;

  _.defaults(api, {
    method: 'GET',
    url: url.format(urlOpts),
    headers: {}
  });

  // Add a default UserAgent, so some servers don't reject our request.
  if (api.headers['User-Agent'] == null) {
    api.headers['User-Agent'] = this.options.userAgent;
  }

  // make it json, but only if content-type is empty or 'application/json'
  if (api.body != null && (!api.headers['Content-Type'] || api.headers['Content-Type'] == 'application/json')) {
    api.json = api.body;
  }

  // Remove entity body for GET requests if body is empty object
  if (api.method === 'GET' && Object.keys(api.body).length === 0) {
    delete api.json;
    delete api.body;
  }

  return api;
};

/**
 * Convert 4xx, 5xx responses to be errors.
 */
RestAdapter.prototype.getErrForResponse = function(res, options) {
  var status = +res.statusCode,
      err = null;

  if (utils.isErrorStatus(status, options)) {
    err = new Error(status + " status");
    err.status = status;
    err.body = res.body;
  }

  return err;
};
