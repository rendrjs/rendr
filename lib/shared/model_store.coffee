MemoryStore = require('./memory_store')
modelUtils = require('./model_utils')

module.exports = class ModelStore extends MemoryStore

  set: (modelName, model) ->
    key = getModelStoreKey(modelName, model.id)
    super key, model.toJSON(), null

  get: (modelName, id) ->
    key = getModelStoreKey(modelName, id)
    modelData = super key
    model =
      if modelData
        modelUtils.getModel(modelName, modelData)
      else
        undefined

getModelStoreKey = (model, id) ->
  "#{model.toLowerCase()}:#{id}"
