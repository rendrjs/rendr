MemoryStore = require('./memory_store')
modelUtils = require('./model_utils')

module.exports = class CollectionStore extends MemoryStore

  set: (collection, params = {}) ->
    key = getStoreKey(collection.constructor.name, params)
    modelIds = collection.pluck('id')
    super key, modelIds, null

  # Returns an array of model ids.
  get: (collectionName, params = {}) ->
    key = getStoreKey(collectionName, params)
    super key

getStoreKey = (collectionName, params) ->
  "#{collectionName.toLowerCase()}:#{JSON.stringify(params)}"
