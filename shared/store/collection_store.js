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
    meta: collection.meta
  };
  return Super.prototype.set.call(this, key, data, null);
};

/*
* Returns an array of model ids.
*/
CollectionStore.prototype.get = function(collectionName, params) {
  var Collection, key;

  params = params || {};

  /*
  * Kind of jank-sauce. Always merge in the default
  * params for the given collection.
  */
  Collection = modelUtils.getCollectionConstructor(collectionName);
  params = _.clone(params);
  params = _.defaults(params, Collection.prototype.defaultParams);
  key = getStoreKey(collectionName, params);
  return Super.prototype.get.call(this, key);
};

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
