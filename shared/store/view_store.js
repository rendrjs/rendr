var MemoryStore, Super, modelUtils, _;

_ = require('underscore');
Super = MemoryStore = require('./memory_store');
modelUtils = require('../modelUtils');

module.exports = ViewStore;

function ViewStore() {
  Super.apply(this, arguments);
}

/**
 * Set up inheritance.
 */
ViewStore.prototype = Object.create(Super.prototype);
ViewStore.prototype.constructor = ViewStore;

ViewStore.prototype.set = function(view) {
  var key, viewName;
  viewName = modelUtils.modelName(view.constructor);
  if (viewName == null) {
    throw new Error('Undefined viewName for view');
  }
  key = getViewStoreKey(viewName);
  return Super.prototype.set.call(this, key, view, null);
};

ViewStore.prototype.get = function(viewName) {
  var key, view;
  key = getViewStoreKey(viewName);
  view = Super.prototype.get.call(this, key);
  if (view) {
    return view;
  }
};

ViewStore.prototype._formatKey = function(key) {
  return Super.prototype._formatKey.call(this, "_vs:" + key);
};

function getViewStoreKey(viewName) {
  return modelUtils.underscorize(viewName);
}
