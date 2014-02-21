var _ = require('underscore'),
    Super = require('./memory_store');

module.exports = CollectionStore;

function CollectionStore() {
  Super.apply(this, arguments);
}

_.extend(CollectionStore.prototype, Super.prototype, {
  set: function(collection, params) {
    var key = this._getStoreKeyForCollection(collection, params);
    return Super.prototype.set.call(this, key, collection, null);
  },

  get: function(collectionName, params, callback) {
    var self = this,
      cachedCollection;

    this.mergeParams(collectionName, params, function (mergedParams) {
      var key = self._getStoreKey(collectionName, mergedParams);

        cachedCollection = Super.prototype.get.call(self, key);

      if (_.isFunction(callback)) {
        callback(cachedCollection);
      }
    });

    return cachedCollection;
  },

  mergeParams: function(collectionName, params, callback) {
    this.modelUtils.getCollectionConstructor(collectionName, function(Collection) {
      var mergedParams = _.extend({}, Collection.prototype.defaultParams, params);
      callback(mergedParams);
    });
  },

  _getStoreKeyForCollection: function(collection, params) {
    var collectionName = this.modelUtils.modelName(collection.constructor);

    params = params || collection.params;
    return this._getStoreKey(collectionName, params);
  },

  _getStoreKey: function(collectionName, params) {
    var underscored = this.modelUtils.underscorize(collectionName);
    return underscored + ":" + JSON.stringify(sortParams(params));
  }
});

function sortParams(params) {
  var sorted = {};
  _.chain(params).keys().sort().forEach(function(key) {
    sorted[key] = params[key];
  });
  return sorted;
}
