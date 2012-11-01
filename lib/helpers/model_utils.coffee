
exports.getModel = (path, attrs = {}, options = {}) ->
  path = underscorize(path)
  model = require(rendr.entryPath + "/app/models/#{path}")
  new model(attrs, options)

exports.getCollection = (path, models = [], options = {}) ->
  path = underscorize(path)
  collection = require(rendr.entryPath + "/app/collections/#{path}")
  new collection(models, options)

uppercaseRe = /([A-Z])/g
exports.underscorize = underscorize = (name) ->
  name = name.replace(uppercaseRe, (char) -> "_" + char.toLowerCase())
  name = name.slice(1) if name[0] is '_'
  name

exports.modelName = (modelOrCollection) ->
  underscorize(modelOrCollection.constructor.name)
