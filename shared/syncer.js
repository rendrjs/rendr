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
  var serverOnly_qs = 'qs';
  var qs = require(serverOnly_qs);
} else {
  Backbone.$ = window.$ || require('jquery');
}

var syncer = module.exports;

function clientSync(method, model, options) {
  var error;
  options = _.clone(options);
  options.url = this.getUrl(options.url, true);
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
  };
  return Backbone.sync(method, model, options);
}

function serverSync(method, model, options) {
  var api, urlParts, verb, req;

  options = _.clone(options);
  options.url = this.getUrl(options.url, false);
  verb = methodMap[method];
  urlParts = options.url.split('?');
  req = this.app.req;

  api = {
    method: verb,
    path: urlParts[0],
    query: qs.parse(urlParts[1]) || {},
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
 * This is used to fire off a 'fetch', compare the results to the data we have,
 * and then trigger a 'refresh' event if the data has changed.
 *
 * Happens only client-side.
 */
syncer.checkFresh = function checkFresh() {
  var url;

  this.app.trigger('checkFresh:start');

  // Lame: have to lazy-require to prevent circular dependency.
  // It is circular dep
  // hide it from requirejs since it's optional/lazy-loaded
  url = this.getUrl(null, true);

  $.getJSON(url, this.params, function(resp) {
    var data, differs;

    // The second argument 'false' tells 'parse()' not to modify the instance.
    data = this.parse(resp, false);
    differs = this.objectsDiffer(data, this.toJSON());
    this.trigger('checkFresh:end', differs);
    if (differs) {
      if (this.app.modelUtils.isModel(this)) {
        this.set(data, {
          silent: true
        });
      } else {
        this.reset(data, {
          parse: true,
          silent: true
        });
      }
      // We manually store the updated data.
      this.store();
      this.trigger('refresh');
    }
  }.bind(this));
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
      url = url.replace(param, value);

      /**
       * Delete the param from params hash, so we don't get urls like:
       * /v1/threads/1234?id=1234...
       */
      delete params[property];
    });
  }
  return url;
};
