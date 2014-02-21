var _ = require('underscore'),
    Super = require('./memory_store');

module.exports = ModelStore;

function ModelStore() {
  Super.apply(this, arguments);
}

_.extend(ModelStore.prototype, Super.prototype, {
  set: function(model) {
    var id, key, modelName;

    id = model.get(model.idAttribute);
    modelName = this.modelUtils.modelName(model.constructor);
    if (modelName == null) {
      throw new Error('Undefined modelName for model');
    }
    key = this._getModelStoreKey(modelName, id);

    return Super.prototype.set.call(this, key, model, null);
  },

  get: function(modelName, id, returnModelInstance) {
    var key, model;

    if (returnModelInstance == null) {
      returnModelInstance = false;
    }
    key = this._getModelStoreKey(modelName, id);
    model = Super.prototype.get.call(this, key);
    if (model) {
      if (returnModelInstance) {
        return model;
      } else {
        return model.toJSON();
      }
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
      return this.cache[foundKey].value.toJSON();
    }
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
