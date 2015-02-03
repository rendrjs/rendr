var _ = require('underscore'),
    Super = require('./memory_store');

module.exports = ModelStore;

function ModelStore() {
  Super.apply(this, arguments);
}

_.extend(ModelStore.prototype, Super.prototype, {
  expireSeconds: null,

  set: function(model) {
    var key, modelName;

    modelName = this.modelUtils.modelName(model.constructor);
    if (modelName == null) {
      throw new Error('Undefined modelName for model');
    }

    key = this._getModelStoreKey(modelName, model.id);

    // Make sure we have a fully parsed model before we store the attributes
    model.parse(model.attributes);

    return Super.prototype.set.call(this, key, model, this.expireSeconds);
  },

  get: function(modelName, id) {
    var key, model;

    key = this._getModelStoreKey(modelName, id);
    return Super.prototype.get.call(this, key);
  },

  clear: function(modelName, id) {
    if (modelName && id) {
      var key = this._getModelStoreKey(modelName, id);
      return Super.prototype.clear.call(this, key);
    } else if (modelName && !id) {
      var cachedItems = this._getCachedItemsByModel(modelName),
        self = this,
        modelStoreKey;
        _.each(cachedItems, function (item) {
          modelStoreKey = self._getModelStoreKey(modelName, item.value.id);
          Super.prototype.clear.call(self, modelStoreKey);
        });
    } else {
      return Super.prototype.clear.call(this, null);
    }
  },

  find: function(modelName, params) {
    var prefix = this._formatKey(this._keyPrefix(modelName)),
      keys = Object.keys(this.cache),
      affectedKeys = keys.filter(getStartsWithFilter(prefix)),
      self = this,
      foundKey;

    foundKey = _.find(affectedKeys, function (key) {
      var cachedModel = self.cache[key].value,
        modelStoreKey = self._getModelStoreKey(modelName, cachedModel.id),
        model = Super.prototype.get.call(self, modelStoreKey);

      return model && isObjectSubset(params, model.toJSON());
    });

    if (foundKey) {
      return this.cache[foundKey].value;
    }
  },

  _getCachedItemsByModel:function(modelName) {
    var prefix = this._formatKey(this._keyPrefix(modelName));
    return _.filter(this.cache, function(val, key) {
      return startsWith(key, prefix);
    });
  },

  _formatKey: function(key) {
    return Super.prototype._formatKey.call(this, "_ms:" + key);
  },

  _keyPrefix: function(modelName) {
    return this.modelUtils.underscorize(modelName);
  },

  _getModelStoreKey: function(modelName, id) {
    return this._keyPrefix(modelName) + ":" + id;
  }
});

function getStartsWithFilter(prefix) {
  return function (string) {
    return startsWith(string, prefix);
  };
}

function startsWith(string, prefix) {
  return string.slice(0, prefix.length) == prefix;
}

function isObjectSubset(potentialSubset, objectToTest) {
  // check all the keys of the subset, and sure their values are the same in the objectToTest
  return _.all(potentialSubset, function(value, key) {
    return objectToTest[key] == value;
  });
}
