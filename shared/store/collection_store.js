var CollectionStore, MemoryStore, getStoreKey, modelUtils, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('underscore');
MemoryStore = require('./memory_store');
modelUtils = require('../modelUtils');

module.exports = CollectionStore = (function(_super) {
  __extends(CollectionStore, _super);

  function CollectionStore() {
    CollectionStore.__super__.constructor.apply(this, arguments);
  }

  CollectionStore.prototype.set = function(collection, params) {
    var data, idAttribute, key;
    params = params || collection.params;
    key = getStoreKey(modelUtils.modelName(collection.constructor), params);
    idAttribute = collection.model.prototype.idAttribute;
    data = {
      ids: collection.pluck(idAttribute),
      meta: collection.meta
    };
    return CollectionStore.__super__.set.call(this, key, data, null);
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
    return CollectionStore.__super__.get.call(this, key);
  };

  CollectionStore.prototype._formatKey = function(key) {
    return CollectionStore.__super__._formatKey.call(this, "_cs:" + key);
  };

  return CollectionStore;

})(MemoryStore);

getStoreKey = function(collectionName, params) {
  var underscored;
  underscored = modelUtils.underscorize(collectionName);
  return "" + underscored + ":" + JSON.stringify(sortParams(params));
};

function sortParams(params) {
  var sorted = {};
  _.chain(params).keys().sort().forEach(function(key) {
    sorted[key] = params[key];
  });
  return sorted;
}
