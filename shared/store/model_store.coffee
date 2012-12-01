MemoryStore = require('./memory_store')
LocalStorageStore = require('./local_storage_store')
modelUtils = require('../model_utils')

# TODO: be less magical. Use composition instead of inheritance.
BaseClass = if LocalStorageStore.canHaz()
  LocalStorageStore
else
  MemoryStore

module.exports = class ModelStore extends BaseClass

  set: (modelName, model) ->
    key = getModelStoreKey(modelName, model.id)
    # We want to merge the model attrs with whatever is already
    # present in the store.
    existingAttrs = @get(modelName, model.id) || {}
    newAttrs = _.extend {}, existingAttrs, model.toJSON()

    super key, newAttrs, null

  get: (modelName, id, returnModelInstance = false) ->
    key = getModelStoreKey(modelName, id)
    modelData = super key
    if modelData
      if returnModelInstance
        modelUtils.getModel(modelName, modelData)
      else
        modelData
    else
      undefined

  _formatKey: (key) ->
   "_ms:#{key}"

getModelStoreKey = (model, id) ->
  "#{model.toLowerCase()}:#{id}"
