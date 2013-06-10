/*global rendr*/

var BaseCollection, BaseModel, classMap, uppercaseRe, utils;

BaseModel = require('./base/model');
BaseCollection = require('./base/collection');

utils = module.exports;

utils.getModel = function(path, attrs, options) {
  var Model;
  attrs = attrs || {};
  options = options || {};
  Model = utils.getModelConstructor(path);
  return new Model(attrs, options);
};

utils.getCollection = function(path, models, options) {
  var Collection;
  models = models || [];
  options = options || {};
  Collection = utils.getCollectionConstructor(path);
  return new Collection(models, options);
};

utils.getModelConstructor = function(path) {
  path = utils.underscorize(path);
  return classMap[path] || require(rendr.entryPath + "/app/models/" + path);
};

utils.getCollectionConstructor = function(path) {
  path = utils.underscorize(path);
  return classMap[path] || require(rendr.entryPath + "/app/collections/" + path);
};

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

utils.modelIdAttribute = function(modelName) {
  var constructor;
  constructor = utils.getModelConstructor(modelName);
  return constructor.prototype.idAttribute;
};
