var Backbone, extractParamNamesRe, methodMap, modelUtils, qs, server, _, syncer;

if (global.isServer) {
  qs = require('qs');
}

_ = require('underscore');
Backbone = require('backbone');

// These are lazy-required.
modelUtils = null;
server = null;

// Pull out params in path, like '/users/:id'.
extractParamNamesRe = /:([a-zA-Z_-]+)/g;

methodMap = {
  'create': 'POST',
  'update': 'PUT',
  'delete': 'DELETE',
  'read': 'GET'
};

syncer = module.exports;

function clientSync(method, model, options) {
  var data;
  data = _.clone(options.data);
  options.url = this.getUrl(options.url, true, data);
  options.data = data;
  options.emulateJSON = true;
  return Backbone.sync(method, model, options);
}

function serverSync(method, model, options) {
  var api, data, urlParts, verb;

  data = _.clone(options.data);
  data = addApiParams(method, model, data);
  options.url = this.getUrl(options.url, false, data);
  verb = methodMap[method];
  urlParts = options.url.split('?');

  api = {
    method: verb,
    path: urlParts[0],
    query: qs.parse(urlParts[1]) || {},
    api: _.result(this, 'api'),
    body: {}
  };

  /**
   * Put the data as form data if POST or PUT,
   * otherwise query string.
   */
  if (verb === 'POST' || verb === 'PUT') {
    api.body = data;
  } else {
    _.extend(api.query, data);
  }
  server = server || require('../server/server');
  server.dataAdapter.request(this.app.req, api, function(err, response, body) {
    if (err) {
      if (!_.isObject(body)) {
        body = {
          body: body
        };
      }

      // Pass through the statusCode, so lower-level code can handle i.e. 401 properly.
      body.status = err.status;

      if (options.error) {
        // This `error` has signature of $.ajax, not Backbone.sync.
        options.error(body);
      } else {
        throw err;
      }
    } else {
      // This `success` has signature of $.ajax, not Backbone.sync.
      options.success(body);
    }
  });
}

function addApiParams(method, model, params) {
  var ret;

  params = params || {};
  ret = _.clone(params);

  /**
   * So, by default Backbone sends all of the model's
   * attributes if we don't pass any in explicitly.
   * This gets screwed up because we append the locale
   * and currency, so let's replicate that behavior.
   */
  if (model && _.isEqual(params, {}) && (method === 'create' || method === 'update')) {
    _.extend(ret, model.toJSON());
  }
  return ret;
}

syncer.getSync = function getSync() {
  if (global.isServer) {
    return serverSync;
  } else {
    return clientSync;
  }
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
    url = syncer.formatClientUrl(url, _.result(this, 'api'));
  }
  return syncer.interpolateParams(this, url, params);
};

syncer.formatClientUrl = function(url, api) {
  var prefix = '/api';
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
  var url,
    _this = this;

  this.app.trigger('checkFresh:start');

  // Lame: have to lazy-require to prevent circular dependency.
  modelUtils = modelUtils || require('./modelUtils');
  url = this.getUrl(null, true);

  $.getJSON(url, this.params, function(resp) {
    var data, differs;

    // The second argument 'false' tells 'parse()' not to modify the instance.
    data = _this.parse(resp, false);
    differs = syncer.objectsDiffer(data, _this.toJSON());
    _this.trigger('checkFresh:end', differs);
    if (differs) {
      if (modelUtils.isModel(_this)) {
        _this.set(data, {
          silent: true
        });
      } else {
        _this.reset(data, {
          parse: true,
          silent: true
        });
      }
      // We manually store the updated data.
      _this.store();
      _this.trigger('refresh');
    }
  });
};

/**
 * Deeply-compare two objects to see if they differ.
 */
syncer.objectsDiffer = function objectsDiffer(data1, data2) {
  var changed, key, keys, value1, value2, _i, _len;

  changed = false;
  keys = _.unique(_.keys(data1).concat(_.keys(data2)));
  for (_i = 0, _len = keys.length; _i < _len; _i++) {
    key = keys[_i];
    value1 = data1[key];
    value2 = data2[key];

    // If attribute is an object recurse
    if (_.isObject(value1) && _.isObject(value2)) {
      changed = syncer.objectsDiffer(value1, value2);
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
  var matches;

  params = params || {};
  matches = url.match(extractParamNamesRe);
  if (matches) {
    matches.forEach(function(param) {
      var property, value;

      property = param.slice(1);

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
