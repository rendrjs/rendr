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
  classMap[path] || require(rendr.entryPath + "/models/#{path}")

utils.getCollectionConstructor = (path) ->
  path = utils.underscorize(path)
  classMap[path] || require(rendr.entryPath + "/collections/#{path}")

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
  name = name.replace(uppercaseRe, (char) -> "_" + char.toLowerCase())
  name = name.slice(1) if name[0] is '_'
  name

utils.modelName = (modelOrCollectionClass) ->
  utils.underscorize(modelOrCollectionClass.name)
