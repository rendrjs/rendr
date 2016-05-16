/**
 * `syncer` is a collection of instance methods that are mixed into the prototypes
 * of `BaseModel` and `BaseCollection`. The purpose is to encapsulate shared logic
 * for fetching data from the API.
 */

var _ = require('underscore'),
    Backbone = require('backbone'),

    // Pull out params in path, like '/users/:id'.
    extractParamNamesRe = /:([a-z_-]+)/ig,

    methodMap = {
      'create': 'POST',
      'update': 'PUT',
      'delete': 'DELETE',
      'read': 'GET'
    },

    isServer = (typeof window === 'undefined');

if (isServer) {
  // hide it from requirejs since it's server only
  var serverOnly_qs = 'qs2';
  var qs = require(serverOnly_qs);
} else {
  var $ = window.$ || require('jquery');
  Backbone.$ = $;
}

var syncer = module.exports;

function clientSync(method, model, options) {
  var error;
  options = _.clone(options);
  if (!_.isUndefined(options.data)) options.data = _.clone(options.data);
  options.url = this.getUrl(options.url, true, options.data);
  error = options.error;
  if (error) {
    options.error = function(xhr) {
      var body = xhr.responseText,
          contentType = xhr.getResponseHeader('content-type'),
          resp;
      if (contentType && contentType.indexOf('application/json') !== -1) {
        try {
          body = JSON.parse(body);
        } catch (e) {}
      }
      resp = {
        body: body,
        status: xhr.status
      };
      error(resp);
    }
  }
  return Backbone.sync(method, model, options);
}

function serverSync(method, model, options) {
  var api, urlParts, verb, req, queryStr;

  options = _.clone(options);
  if (!_.isUndefined(options.data)) options.data = _.clone(options.data);
  options.url = this.getUrl(options.url, false, options.data);
  verb = methodMap[method];
  urlParts = options.url.split('?');
  req = this.app.req;
  queryStr = urlParts[1] || '';
  if (!_.isEmpty(options.data)) queryStr += '&' + qs.stringify(options.data);
  /**
   * if queryStr is initially an empty string, leading '&' will still get parsed correctly by qs.parse below.
   * e.g.  qs.parse('&baz=quux') => { baz: 'quux' }
   */

  api = {
    method: verb,
    path: urlParts[0],
    query: qs.parse(queryStr),
    headers: options.headers || {},
    api: _.result(this, 'api'),
    body: {}
  };

  if (verb === 'POST' || verb === 'PUT') {
    api.body = model.toJSON();
  }

  req.dataAdapter.request(req, api, function(err, response, body) {
    var resp;
    if (err) {
      resp = {
        body: body,
        // Pass through the statusCode, so lower-level code can handle i.e. 401 properly.
        status: err.status
      };

      if (options.error) {
        // This `error` has signature of $.ajax, not Backbone.sync.
        options.error(resp);
      } else {
        throw err;
      }
    } else {
      // This `success` has signature of $.ajax, not Backbone.sync.
      options.success(body);
    }
  });
}

syncer.clientSync = clientSync;
syncer.serverSync = serverSync;
syncer.sync = function sync() {
  var syncMethod = isServer ? serverSync : clientSync;
  return syncMethod.apply(this, arguments);
};

/**
 * 'model' is either a model or collection that
 * has a 'url' property, which can be a string or function.
 */
syncer.getUrl = function getUrl(url, clientPrefix, params) {
  if (clientPrefix == null) {
    clientPrefix = false;
  }
  params = params || {};
  url = url || _.result(this, 'url');
  if (clientPrefix && !~url.indexOf('://')) {
    url = this.formatClientUrl(url, _.result(this, 'api'));
  }
  return this.interpolateParams(this, url, params);
};

syncer.formatClientUrl = function(url, api) {
  var prefix = this.app.get('apiPath') || '/api';
  if (api) {
    prefix += '/' + api;
  }
  prefix += '/-';
  return prefix + url;
};

/**
 * Deeply-compare two objects to see if they differ.
 */
syncer.objectsDiffer = function objectsDiffer(data1, data2) {
  var changed = false,
      keys,
      key,
      value1,
      value2;

  keys = _.unique(_.keys(data1).concat(_.keys(data2)));
  for (var i = 0, len = keys.length; i < len; i++) {
    key = keys[i];
    value1 = data1[key];
    value2 = data2[key];

    // If attribute is an object recurse
    if (_.isObject(value1) && _.isObject(value2)) {
      changed = this.objectsDiffer(value1, value2);
    // Test for equality
    } else if (!_.isEqual(value1, value2)) {
      changed = true;
    }
  }
  return changed;
};

/**
 * This maps i.e. '/listings/:id' to '/listings/3' if
 * the model you supply has model.get('id') == 3.
 */
syncer.interpolateParams = function interpolateParams(model, url, params) {
  var matches = url.match(extractParamNamesRe);

  params = params || {};

  if (matches) {
    matches.forEach(function(param) {
      var property = param.slice(1),
          value;

      // Is collection? Then use options.
      if (model.length != null) {
        value = model.options[property];

      // Otherwise it's a model; use attrs.
      } else {
        value = model.get(property);
      }
      url = url.replace(param, encodeURIComponent(value));

      /**
       * Delete the param from params hash, so we don't get urls like:
       * /v1/threads/1234?id=1234...
       */
      delete params[property];
    });
  }
  /**
   * Separate deletion of idAttribute from params hash necessary if using urlRoot in the model
   * so we don't get urls like: /v1/threads/1234?id=1234
   */
  delete params[model.idAttribute]
  return url;
};
