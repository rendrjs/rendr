var BaseCollection, BaseModel, ModelUtils;

BaseModel = require("./base/model");

BaseCollection = require("./base/collection");

module.exports = ModelUtils = (function() {
  function ModelUtils(entryPath) {
    this.entryPath = entryPath;
    this._classMap = {};
    this.modelInstances = {};
  }

  ModelUtils.prototype.clean = function(){
    this.modelInstances = {};
  }

  ModelUtils.prototype.getModel = function(path, attrs, options) {
    var Model, modelId, key;
    attrs = attrs || {};
    options = options || {};
    Model = this.getModelConstructor(path);
    modelId = attrs[this.modelIdAttribute(path)];
    if (modelId && !isServer) {
      key = path+":"+modelId;
      return this.modelInstances[key] || (this.modelInstances[key] = new Model(attrs, options));
    }
    return new Model(attrs, options);
  };

  ModelUtils.prototype.getCollection = function(path, models, options) {
    var Collection;
    models = models || [];
    options = options || {};
    Collection = this.getCollectionConstructor(path);
    return new Collection(models, options);
  };

  ModelUtils.prototype.getModelConstructor = function(path) {
    path = this.underscorize(path);
    return this._classMap[path] || require(this.entryPath + "app/models/" + path);
  };

  ModelUtils.prototype.getCollectionConstructor = function(path) {
    path = this.underscorize(path);
    return this._classMap[path] || require(this.entryPath + "app/collections/" + path);
  };

  ModelUtils.prototype.isModel = function(obj) {
    return obj instanceof BaseModel;
  };

  ModelUtils.prototype.isCollection = function(obj) {
    return obj instanceof BaseCollection;
  };

  ModelUtils.prototype.getModelNameForCollectionName = function(collectionName) {
    var Collection;
    Collection = this.getCollectionConstructor(collectionName);
    return this.modelName(Collection.prototype.model);
  };

  ModelUtils.uppercaseRe = /([A-Z])/g;

  ModelUtils.prototype.underscorize = function(name) {
    if (name == null) {
      return undefined;
    }
    name = name.replace(ModelUtils.uppercaseRe, function(c) {
      return "_" + c.toLowerCase();
    });
    if (name[0] === "_") {
      name = name.slice(1);
    }
    return name;
  };

  /*
  The 'name' property is added to the constructor when using a named function,
  and it cannot be changed.  I.e.:

  function MyClass(){}
  MyClass.name
  -> "MyClass"

  We first look for the 'id' property of the constructor, which is compatible
  with standard Backbone-style class inheritance.

  var MyClass = Backbone.Model.extend({});
  MyClass.name
  -> ""
  MyClass.id = "MyClass"
  */


  ModelUtils.prototype.modelName = function(modelOrCollectionClass) {
    return this.underscorize(modelOrCollectionClass.id || modelOrCollectionClass.name);
  };

  ModelUtils.prototype.modelIdAttribute = function(modelName) {
    var constructor;
    constructor = this.getModelConstructor(modelName);
    return constructor.prototype.idAttribute;
  };

  return ModelUtils;

})();
