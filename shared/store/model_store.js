var MemoryStore, ModelStore, modelUtils, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('underscore');
MemoryStore = require('./memory_store');
modelUtils = require('../modelUtils');

module.exports = ModelStore = (function(_super) {
  __extends(ModelStore, _super);

  function ModelStore() {
    ModelStore.__super__.constructor.apply(this, arguments);
  }

  ModelStore.prototype.set = function(model) {
    var existingAttrs, id, key, modelName, newAttrs;

    id = model.get(model.idAttribute);
    modelName = modelUtils.modelName(model.constructor);
    if (modelName == null) {
      throw new Error('Undefined modelName for model');
    }
    key = getModelStoreKey(modelName, id);

    /*
    * We want to merge the model attrs with whatever is already
    * present in the store.
    */
    existingAttrs = this.get(modelName, id) || {};
    newAttrs = _.extend({}, existingAttrs, model.toJSON());
    return ModelStore.__super__.set.call(this, key, newAttrs, null);
  };

  ModelStore.prototype.get = function(modelName, id, returnModelInstance) {
    var key, modelData;

    if (returnModelInstance == null) {
      returnModelInstance = false;
    }
    key = getModelStoreKey(modelName, id);
    modelData = ModelStore.__super__.get.call(this, key);
    if (modelData) {
      if (returnModelInstance) {
        return modelUtils.getModel(modelName, modelData, {
          app: this.app
        });
      } else {
        return modelData;
      }
    }
  };

  ModelStore.prototype._formatKey = function(key) {
    return ModelStore.__super__._formatKey.call(this, "_ms:" + key);
  };

  return ModelStore;

})(MemoryStore);

function getModelStoreKey(modelName, id) {
  var underscored = modelUtils.underscorize(modelName);
  return underscored + ":" + id;
}
