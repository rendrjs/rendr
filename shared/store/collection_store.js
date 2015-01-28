var _ = require('underscore'),
    Super = require('./memory_store');

module.exports = CollectionStore;

function CollectionStore() {
  Super.apply(this, arguments);
}

_.extend(CollectionStore.prototype, Super.prototype, {
  expireSeconds: null,

  set: function(collection, params) {
    var key = this._getStoreKeyForCollection(collection, params);
    return Super.prototype.set.call(this, key, collection, this.expireSeconds);
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

  clear: function(collectionName, params) {
    if (!_.isUndefined(collectionName) && params) {
      var key = this._getStoreKey(collectionName, params);
      return Super.prototype.clear.call(this, key);      
    } else if (!_.isUndefined(collectionName) && !params) {
      var cachedItems = this._getCachedItemsByCollection(collectionName),
        self = this,
        storeKey;
       _.each(cachedItems, function (item) {
          storeKey = self._getStoreKey(collectionName, item.value.params);
          Super.prototype.clear.call(self, storeKey);
        });
    } else {
      return Super.prototype.clear.call(this, null);
    }
  },

  mergeParams: function(collectionName, params, callback) {
    this.modelUtils.getCollectionConstructor(collectionName, function(Collection) {
      var mergedParams = _.extend({}, Collection.prototype.defaultParams, params);
      callback(mergedParams);
    });
  },

  _getCachedItemsByCollection:function(collectionName) {
    var prefix = this._formatKey(this.modelUtils.underscorize(collectionName));

    return _.filter(this.cache, function(val, key) {
      return startsWith(key, prefix);
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

function startsWith(string, prefix) {
  return string.slice(0, prefix.length) == prefix;
}
