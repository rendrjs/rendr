MemoryStore = require('./memory_store')
modelUtils = require('./model_utils')

module.exports = class ModelStore extends MemoryStore

  set: (modelName, model) ->
    key = getModelStoreKey(modelName, model.id)
    # We want to merge the model attrs with whatever is already
    # present in the store.
    existingModel = @get(modelName, model.id)
    # TODO: Don't create a model just to call toJSON().
    attrs = existingModel?.toJSON() || {}
    newAttrs = _.extend {}, attrs, model.toJSON()

    super key, newAttrs, null

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
