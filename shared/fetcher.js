var Backbone, CollectionStore, ModelStore, async, modelUtils, _;

_ = require('underscore');
Backbone = require('backbone');
async = require('async');

modelUtils = require('./modelUtils');
ModelStore = require('./store/model_store');
CollectionStore = require('./store/collection_store');

if (!global.isServer) {
  Backbone.$ = window.$;
}

module.exports = Fetcher;

function Fetcher(options) {
  this.options = options;
  this.app = this.options.app;
  this.modelStore = new ModelStore({
    app: this.app
  });
  this.collectionStore = new CollectionStore({
    app: this.app
  });
}

/**
 * Returns an instance of Model or Collection.
 */
Fetcher.prototype.getModelForSpec = function(spec, attrsOrModels, options) {
  var method, modelName;
  options = options || {};
  if (spec.model != null) {
    method = 'getModel';
    modelName = spec.model;
    attrsOrModels = attrsOrModels || {};
  } else {
    method = 'getCollection';
    modelName = spec.collection;
    attrsOrModels = attrsOrModels || [];
  }

  /**
   * We have to initialize the model with its ID for now
   * so that the model can interpolate its url '/listings/:id'
   * to i.e. '/listings/42'. See 'syncer' module.
   */
  if (spec.params != null) {
    if (spec.model != null) {
      // If it's a model, merge the given params with the model attributes.
      _.defaults(attrsOrModels, spec.params);
    } else if (spec.collection != null) {
      // If it's a collection, merge the given params with the options.
      _.defaults(options, spec.params);
    }
  }
  _.defaults(options, {
    app: this.app
  });
  return modelUtils[method](modelName, attrsOrModels, options);
};

/**
 * Used to hold timestamps of when 'checkFresh()' was called on a model/collection.
 * We use this to throttle it in 'shouldCheckFresh()'.
 */
Fetcher.prototype.checkedFreshTimestamps = {};

/**
 * Only once every ten seconds. Smarter?
 */
Fetcher.prototype.checkedFreshRate = 10000;

Fetcher.prototype.shouldCheckFresh = function(spec) {
  var key = this.checkedFreshKey(spec)
    , timestamp = this.checkedFreshTimestamps[key];
  if (!timestamp) {
    return true;
  }
  if (new Date().getTime() - timestamp > this.checkedFreshRate) {
    return true;
  }
  return false;
};

Fetcher.prototype.didCheckFresh = function(spec) {
  var key = this.checkedFreshKey(spec);
  this.checkedFreshTimestamps[key] = new Date().getTime();
};

Fetcher.prototype.checkedFreshKey = function(spec) {
  var meta;
  meta = {
    name: spec.model || spec.collection,
    params: spec.params
  };
  return JSON.stringify(meta);
};

/**
 * map fetchSpecs to models and fetch data in parallel
 */
Fetcher.prototype._retrieve = function(fetchSpecs, options, callback) {
  var batchedRequests = {};

  _.each(fetchSpecs, function(spec, name) {
    batchedRequests[name] = function(cb) {
      var collectionData, model, modelData, modelOptions;

      if (!options.readFromCache) {
        this.fetchFromApi(spec, cb);
      } else {
        modelData = null;
        modelOptions = {};

        // First, see if we have stored the model or collection.
        if (spec.model != null) {
          modelData = this._retrieveModel(spec);
        } else if (spec.collection != null) {
          collectionData = this.collectionStore.get(spec.collection, spec.params);
          if (collectionData) {
            modelData = this.retrieveModelsForCollectionName(spec.collection, collectionData.ids);
            modelOptions = {
              meta: collectionData.meta,
              params: collectionData.params
            };
          }
        }

        // If we found the model/collection in the store, then return that.
        if (!this.needsFetch(modelData, spec)) {
          model = this.getModelForSpec(spec, modelData, modelOptions);

          /**
           * If 'checkFresh' is set (and we're in the client), then before we
           * return the cached object we fire off a fetch, compare the results,
           * and if the data is different, we trigger a 'refresh' event.
           */
          if (spec.checkFresh && !global.isServer && this.shouldCheckFresh(spec)) {
            model.checkFresh();
            this.didCheckFresh(spec);
          }
          cb(null, model);
        } else {
          /**
           * Else, fetch anew.
           */
          this.fetchFromApi(spec, cb);
        }
      }
    }.bind(this);
  }, this);
  async.parallel(batchedRequests, callback);
};

Fetcher.prototype._retrieveModel = function(spec) {
  var idAttribute, modelData;
  // Attempt to fetch from the modelStore based on the idAttribute
  idAttribute = modelUtils.modelIdAttribute(spec.model);
  modelData = this.modelStore.get(spec.model, spec.params[idAttribute]);
  if (modelData)
    return modelData;

  // if there are no other keys than the id in the params, return null;
  if (_.isEmpty(_.omit(spec.params, idAttribute)))
    return null;
  // Attempt to fetch the model in the modelStore based on the other params
  return this.modelStore.find(spec.model, spec.params);
};

Fetcher.prototype.needsFetch = function(modelData, spec) {
  if (modelData == null) return true;
  if (this.isMissingKeys(modelData, spec.ensureKeys)) return true;
  if (typeof spec.needsFetch === 'function' && spec.needsFetch(modelData)) return true;
  return false;
};

Fetcher.prototype.isMissingKeys = function(modelData, keys) {
  var key, _i, _len;

  if (keys == null) {
    return false;
  }
  if (!_.isArray(keys)) {
    keys = [keys];
  }
  for (_i = 0, _len = keys.length; _i < _len; _i++) {
    key = keys[_i];
    if (modelData[key] == null) {
      return true;
    }
  }
  return false;
};

Fetcher.prototype.fetchFromApi = function(spec, callback) {
  var model = this.getModelForSpec(spec);
  model.fetch({
    data: spec.params,
    success: function(model, body) {
      callback(null, model);
    },
    error: function(model, resp, options) {
      var body, respOutput, err;

      body = resp.body;
      resp.body = typeof body === 'string' ? body.slice(0, 150) : body;
      respOutput = JSON.stringify(resp);
      err = new Error("ERROR fetching model '" + modelUtils.modelName(model.constructor) + "' with options '" + JSON.stringify(options) + "'. Response: " + respOutput);
      err.status = resp.status;
      err.body = body;
      callback(err);
    }
  });
};

Fetcher.prototype.retrieveModelsForCollectionName = function(collectionName, modelIds) {
  var modelName = modelUtils.getModelNameForCollectionName(collectionName);
  return this.retrieveModels(modelName, modelIds);
};

Fetcher.prototype.retrieveModels = function(modelName, modelIds) {
  return modelIds.map(function(id) {
    return this.modelStore.get(modelName, id);
  }, this);
};

Fetcher.prototype.summarize = function(modelOrCollection) {
  var summary = {}
    , idAttribute;

  if (modelUtils.isCollection(modelOrCollection)) {
    idAttribute = modelOrCollection.model.prototype.idAttribute;
    summary = {
      collection: modelUtils.modelName(modelOrCollection.constructor),
      ids: modelOrCollection.pluck(idAttribute),
      params: modelOrCollection.params,
      meta: modelOrCollection.meta
    };
  } else if (modelUtils.isModel(modelOrCollection)) {
    idAttribute = modelOrCollection.idAttribute;
    summary = {
      model: modelUtils.modelName(modelOrCollection.constructor),
      id: modelOrCollection.get(idAttribute)
    };
  }
  return summary;
};

Fetcher.prototype.storeResults = function(results) {
  _.each(results, function(modelOrCollection) {
    modelOrCollection.store();
  });
};

Fetcher.prototype.bootstrapData = function(modelMap) {
  var results = {}
    , modelOrCollection;

  _.each(modelMap, function(map, name) {
    modelOrCollection = this.getModelForSpec(map.summary, map.data, _.pick(map.summary, 'params', 'meta'));
    results[name] = modelOrCollection;
  }, this);
  this.storeResults(results);
};

Fetcher.prototype.hydrate = function(summaries, options) {
  var collectionData, collectionOptions, models, results;

  options = options || {};
  results = {};
  _.each(summaries, function(summary, name) {
    if (summary.model != null) {
      results[name] = this.modelStore.get(summary.model, summary.id, true);
    } else if (summary.collection != null) {
      // Also support getting all models for a collection.
      collectionData = this.collectionStore.get(summary.collection, summary.params);
      if (collectionData == null) {
        throw new Error("Collection of type \"" + summary.collection + "\" not found for params: " + JSON.stringify(summary.params));
      }
      models = this.retrieveModelsForCollectionName(summary.collection, collectionData.ids);
      collectionOptions = {
        params: summary.params,
        meta: collectionData.meta,
        app: options.app
      };
      results[name] = modelUtils.getCollection(summary.collection, models, collectionOptions);
    }
    if ((results[name] != null) && (options.app != null)) {
      results[name].app = options.app;
    }
  }, this);
  return results;
};

Fetcher.prototype.pendingFetches = 0;

Fetcher.prototype.fetch = function(fetchSpecs, options, callback) {
  var _this = this;

  /**
   * Support both (fetchSpecs, options, callback)
   * and (fetchSpecs, callback).
   */
  if (arguments.length === 2) {
    callback = options;
    options = {};
  } else {
    options = options || {};
  }

  // Different defaults for client v server.
  if (global.isServer) {
    if (options.readFromCache == null) {
      options.readFromCache = false;
    }
    if (options.writeToCache == null) {
      options.writeToCache = false;
    }
  } else {
    if (options.readFromCache == null) {
      options.readFromCache = true;
    }
    if (options.writeToCache == null) {
      options.writeToCache = true;
    }
  }

  this.pendingFetches++;
  this.trigger('fetch:start', fetchSpecs);
  this._retrieve(fetchSpecs, options, function(err, results) {
    _this.pendingFetches--;
    _this.trigger('fetch:end', fetchSpecs, err, results);
    if (err) return callback(err);
    if (options.writeToCache) {
      _this.storeResults(results);
    }
    callback(null, results);
  });
};

// Mixin Backbone.Events for events that work in client & server.
_.extend(Fetcher.prototype, Backbone.Events);
