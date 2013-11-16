/*global rendr*/

// Since we make rendr files AMD friendly on app setup stage
// we need to pretend that this code is pure commonjs
// means no AMD-style require calls
var requireAMD = require;

var typePath = {
  model: "app/models/",
  collection: "app/collections/"
}

var BaseCollection, BaseModel, classMap, uppercaseRe, utils;

BaseModel = require('./base/model');
BaseCollection = require('./base/collection');

utils = module.exports;

utils.getModel = function(path, attrs, options, callback) {
  var Model;
  attrs = attrs || {};
  options = options || {};
  if (typeof callback == 'function') {
    utils.getModelConstructor(path, function(Model) {
      callback(new Model(attrs, options));
    });
  } else {
    Model = utils.getModelConstructor(path);
    return new Model(attrs, options);
  }
};

utils.getCollection = function(path, models, options, callback) {
  var Collection;
  models = models || [];
  options = options || {};
  if (typeof callback == 'function') {
    utils.getCollectionConstructor(path, function(Collection) {
      callback(new Collection(models, options));
    });
  } else {
    Collection = utils.getCollectionConstructor(path);
    return new Collection(models, options);
  }
};

utils.getModelConstructor = function(path, callback) {
  return this._fetchConstructor('model', path, callback);
};

utils.getCollectionConstructor = function(path, callback) {
  return this._fetchConstructor('collection', path, callback);
};

utils._fetchConstructor = function(type, path, callback) {
  path = utils.underscorize(path);

  var fullPath = rendr.entryPath + typePath[type] + path;

  if (classMap[path]) {
    return (typeof callback == 'function') ? callback(classMap[path]) : classMap[path];
  } else if (typeof callback == 'function') {
    // Only used in AMD environment
    if (typeof define != 'undefined')
    {
      requireAMD([fullPath], callback);
    }
    else
    {
      callback(require(fullPath));
    }
    return;
  }
  else
  {
    return require(fullPath);
  }
}

utils.getConstructor = function(type, path) {
  var method;
  method = type === 'model' ? utils.getModelConstructor : utils.getCollectionConstructor;
  return method(path);
};

utils.isModel = function(obj) {
  return obj instanceof BaseModel;
};

utils.isCollection = function(obj) {
  return obj instanceof BaseCollection;
};

utils.getModelNameForCollectionName = function(collectionName) {
  var Collection;

  Collection = utils.getCollectionConstructor(collectionName);
  return utils.modelName(Collection.prototype.model);
};

classMap = {};

/**
 * Use this to specify class constructors based on
 * model/collection name. Useful i.e. for testing.
 */
utils.addClassMapping = function(key, modelConstructor) {
  classMap[utils.underscorize(key)] = modelConstructor;
};

uppercaseRe = /([A-Z])/g;

utils.underscorize = function(name) {
  if (name == null) {
    return undefined;
  }
  name = name.replace(uppercaseRe, function(c) {
    return "_" + c.toLowerCase();
  });
  if (name[0] === '_') {
    name = name.slice(1);
  }
  return name;
};

/**
 * The 'name' property is added to the constructor when using a named function,
 * and it cannot be changed.  I.e.:
 *
 *   function MyClass(){}
 *   MyClass.name
 *     -> "MyClass"
 *
 * We first look for the 'id' property of the constructor, which is compatible
 *  with standard Backbone-style class inheritance.
 *
 *   var MyClass = Backbone.Model.extend({});
 *   MyClass.name
 *     -> ""
 *   MyClass.id = "MyClass"
 *
 */
utils.modelName = function(modelOrCollectionClass) {
  return utils.underscorize(modelOrCollectionClass.id || modelOrCollectionClass.name);
};

utils.modelIdAttribute = function(modelName, callback) {
  utils.getModelConstructor(modelName, function(constructor)
  {
    callback(constructor.prototype.idAttribute);
  });
};
