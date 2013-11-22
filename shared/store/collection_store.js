var MemoryStore, Super, _;

_ = require('underscore');
Super = MemoryStore = require('./memory_store');

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
  key = this._getStoreKey(this.modelUtils.modelName(collection.constructor), params);
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
CollectionStore.prototype.get = function(collectionName, params) {
  var Collection, key;

  params = params || {};

  /*
  * Kind of jank-sauce. Always merge in the default
  * params for the given collection.
  */
  Collection = this.modelUtils.getCollectionConstructor(collectionName);
  params = _.clone(params);
  params = _.defaults(params, Collection.prototype.defaultParams);
  key = this._getStoreKey(collectionName, params);
  return Super.prototype.get.call(this, key);
};

CollectionStore.prototype._formatKey = function(key) {
  return Super.prototype._formatKey.call(this, "_cs:" + key);
};

CollectionStore.prototype._getStoreKey = function(collectionName, params) {
  var underscored;
  underscored = this.modelUtils.underscorize(collectionName);
  return underscored + ":" + JSON.stringify(sortParams(params));
}

function sortParams(params) {
  var sorted = {};
  _.chain(params).keys().sort().forEach(function(key) {
    sorted[key] = params[key];
  });
  return sorted;
}
