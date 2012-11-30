MemoryStore = require('./memory_store')
LocalStorageStore = require('./local_storage_store')
modelUtils = require('../model_utils')

# TODO: be less magical. Use composition instead of inheritance.
BaseClass = if global.isServer
  MemoryStore
else
  LocalStorageStore

module.exports = class CollectionStore extends BaseClass

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
