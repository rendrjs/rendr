var _ = require('underscore'),
    Super = require('./memory_store');

module.exports = ModelStore;

function ModelStore() {
  Super.apply(this, arguments);
}

/**
 * Set up inheritance.
 */
ModelStore.prototype = Object.create(Super.prototype);
ModelStore.prototype.constructor = ModelStore;

ModelStore.prototype.set = function(model) {
  var existingAttrs, id, key, modelOrCollectionName, newAttrs, constructor;

  id = model.get(model.idAttribute);
  modelOrCollectionName = this.modelUtils.modelOrCollectionName(model.constructor);
  if (!modelOrCollectionName && model.collection) {
    modelOrCollectionName = this.modelUtils.modelOrCollectionName(model.collection.constructor);
  }
  /**
   * If the model is not named and not part of a named collection,
   * fall back to an empty string to preserve existing behavior.
   */
  modelOrCollectionName = modelOrCollectionName || '';
  key = this._getModelStoreKey(modelOrCollectionName, id);

  /**
   * We want to merge the model attrs with whatever is already
   * present in the store.
   */
  existingAttrs = this.get(modelOrCollectionName, id) || {};
  newAttrs = _.extend({}, existingAttrs, model.toJSON());
  return Super.prototype.set.call(this, key, newAttrs, null);
};

ModelStore.prototype.get = function(modelOrCollectionName, id, returnModelInstance) {
  var key, modelData;

  if (returnModelInstance == null) {
    returnModelInstance = false;
  }
  key = this._getModelStoreKey(modelOrCollectionName, id);

  modelData = Super.prototype.get.call(this, key);
  if (modelData) {
    if (returnModelInstance) {
      return this.modelUtils.getModel(modelOrCollectionName, modelData, {
        app: this.app
      }, null, true);
    } else {
      return modelData;
    }
  }
};

ModelStore.prototype.find = function(modelOrCollectionName, params) {
  var prefix, foundCachedObject, _this, data, foundCachedObjectKey;
  prefix = this._formatKey(this._keyPrefix(modelOrCollectionName));
  _this = this;
  // find the cached object that has attributes which are a subset of the params
  foundCachedObject = _.find(this.cache, function(cacheObject, key) {
    // since we're iterating over the entire cache, prevent searching different models
    if (!startsWith(key, prefix))
      return false;
    // ensure the object is still within the cache ttl
    data = Super.prototype.validateExpiration.call(_this, key, cacheObject);
    // validate subset
    if (data && isObjectSubset(params, data)) {
      // we store the key outside the iterator because _.find only returns the value, not the key
      foundCachedObjectKey = key;
      return true;
    }
    return false;
  });
  return foundCachedObject && Super.prototype.validateExpiration.call(this, foundCachedObjectKey, foundCachedObject);
}

ModelStore.prototype._formatKey = function(key) {
  return Super.prototype._formatKey.call(this, "_ms:" + key);
};

function startsWith(string, prefix) {
  return string.slice(0, prefix.length) == prefix;
}

function isObjectSubset(potentialSubset, objectToTest) {
  // check all the keys of the subset, and sure their values are the same in the objectToTest
  return _.all(potentialSubset, function(value, key) {
    return objectToTest[key] == value;
  });
}

ModelStore.prototype._keyPrefix = function(modelOrCollectionName) {
  return this.modelUtils.underscorize(modelOrCollectionName);
}

ModelStore.prototype._getModelStoreKey = function(modelOrCollectionName, id) {
  return this._keyPrefix(modelOrCollectionName) + ":" + id;
}
