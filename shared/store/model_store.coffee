MemoryStore = require('./memory_store')
modelUtils = require('../modelUtils')

module.exports = class ModelStore extends MemoryStore

  set: (model) ->
    id = model.get(model.idAttribute)
    modelName = modelUtils.modelName(model.constructor)
    throw new Error('Undefined modelName for model') unless modelName?
    key = getModelStoreKey(modelName, id)
    # We want to merge the model attrs with whatever is already
    # present in the store.
    existingAttrs = @get(modelName, id) || {}
    newAttrs = _.extend {}, existingAttrs, model.toJSON()

    super key, newAttrs, null

  get: (modelName, id, returnModelInstance = false) ->
    key = getModelStoreKey(modelName, id)
    modelData = super key
    if modelData
      if returnModelInstance
        modelUtils.getModel(modelName, modelData, {@app})
      else
        modelData
    else
      undefined

  _formatKey: (key) ->
   super "_ms:#{key}"

getModelStoreKey = (modelName, id) ->
  underscored = modelUtils.underscorize(modelName)
  "#{underscored}:#{id}"
