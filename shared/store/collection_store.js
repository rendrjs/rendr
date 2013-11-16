var MemoryStore, Super, modelUtils, _;

_ = require('underscore');
Super = MemoryStore = require('./memory_store');
modelUtils = require('../modelUtils');

module.exports = CollectionStore;

function CollectionStore() {
  Super.apply(this, arguments);
}

/**
 * Set up inheritance.
 */
CollectionStore.prototype = Object.create(Super.prototype);
CollectionStore.prototype.constructor = CollectionStore;

CollectionStore.prototype.set = function(collection, params) {
  var data, idAttribute, key;
  params = params || collection.params;
  key = getStoreKey(modelUtils.modelName(collection.constructor), params);
  idAttribute = collection.model.prototype.idAttribute;
  data = {
    ids: collection.pluck(idAttribute),
    meta: collection.meta,
    params: collection.params
  };
  return Super.prototype.set.call(this, key, data, null);
};

/*
* Returns an array of model ids.
*/
CollectionStore.prototype.get = function(collectionName, params, callback) {
  var Collection, key, _collectionStore = this;

  /*
  * Kind of jank-sauce. Always merge in the default
  * params for the given collection.
  */
  if (typeof callback == 'function') {
    modelUtils.getCollectionConstructor(collectionName, function(Collection)
    {
      callback(_collectionStore._getPostConstructor(collectionName, params, Collection));
    });
    return;
  } else {
    Collection = modelUtils.getCollectionConstructor(collectionName);
    return this._getPostConstructor(collectionName, params, Collection);
  }
};

CollectionStore.prototype._getPostConstructor = function(collectionName, params, Collection)
{
  params = params || {};

  params = _.clone(params);
  params = _.defaults(params, Collection.prototype.defaultParams);
  key = getStoreKey(collectionName, params);
  return Super.prototype.get.call(this, key);
}

CollectionStore.prototype._formatKey = function(key) {
  return Super.prototype._formatKey.call(this, "_cs:" + key);
};

function getStoreKey(collectionName, params) {
  var underscored;
  underscored = modelUtils.underscorize(collectionName);
  return underscored + ":" + JSON.stringify(sortParams(params));
}

function sortParams(params) {
  var sorted = {};
  _.chain(params).keys().sort().forEach(function(key) {
    sorted[key] = params[key];
  });
  return sorted;
}
