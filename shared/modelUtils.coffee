BaseModel = require('./base/model')
BaseCollection = require('./base/collection')

utils = module.exports

utils.getModel = (path, attrs = {}, options = {}) ->
  Model = utils.getModelConstructor(path)
  new Model(attrs, options)

utils.getCollection = (path, models = [], options = {}) ->
  Collection = utils.getCollectionConstructor(path)
  new Collection(models, options)

utils.getModelConstructor = (path) ->
  path = utils.underscorize(path)
  classMap[path] || require(rendr.entryPath + "/app/models/#{path}")

utils.getCollectionConstructor = (path) ->
  path = utils.underscorize(path)
  classMap[path] || require(rendr.entryPath + "/app/collections/#{path}")

utils.getConstructor = (type, path) ->
  method = if type is 'model'
    utils.getModelConstructor
  else
    utils.getCollectionConstructor
  method(path)

utils.isModel = (obj) ->
  obj instanceof BaseModel

utils.isCollection = (obj) ->
  obj instanceof BaseCollection

utils.getModelNameForCollectionName = (collectionName) ->
  Collection = utils.getCollectionConstructor(collectionName)
  utils.modelName(Collection::model)

classMap = {}
# Use this to specify class constructors based on
# model/collection name. Useful i.e. for testing.
utils.addClassMapping = (key, modelConstructor) ->
 classMap[utils.underscorize(key)] = modelConstructor


uppercaseRe = /([A-Z])/g
utils.underscorize = (name) ->
  return undefined unless name?
  name = name.replace(uppercaseRe, (char) -> "_" + char.toLowerCase())
  name = name.slice(1) if name[0] is '_'
  name

# The 'name' property is added to the constructor when using a named function,
# and it cannot be changed.  I.e.:
#
#   function MyClass(){}
#   MyClass.name
#     -> "MyClass"
#
# We first look for the 'id' property of the constructor, which is compatible
#  with standard Backbone-style class inheritance.
#
#   var MyClass = Backbone.Model.extend({});
#   MyClass.name
#     -> ""
#   MyClass.id = "MyClass"
#
utils.modelName = (modelOrCollectionClass) ->
  utils.underscorize(modelOrCollectionClass.id || modelOrCollectionClass.name)

utils.modelIdAttribute = (modelName) ->
  constructor = utils.getModelConstructor(modelName)
  constructor.prototype.idAttribute
