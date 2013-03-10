MemoryStore = require('./memory_store')
LocalStorageStore = require('./local_storage_store')
modelUtils = require('../model_utils')

# TODO: be less magical. Use composition instead of inheritance.
BaseClass = if LocalStorageStore.canHaz()
  LocalStorageStore
else
  MemoryStore

module.exports = class CollectionStore extends BaseClass

  set: (collection, params = null) ->
    params ||= collection.params
    key = getStoreKey(collection.constructor.name, params)
    data =
      ids: collection.pluck('id')
      meta: collection.meta
    super key, data, null

  # Returns an array of model ids.
  get: (collectionName, params = {}) ->
    # Kind of jank-sauce. Always merge in the default
    # params for the given collection.
    Collection = modelUtils.getCollectionConstructor(collectionName)

    params = _.clone(params)
    params = _.defaults(params, Collection::defaultParams)

    key = getStoreKey(collectionName, params)
    super key

  _formatKey: (key) ->
   super "_cs:#{key}"

getStoreKey = (collectionName, params) ->
  underscored = modelUtils.underscorize(collectionName)
  "#{underscored}:#{JSON.stringify(sortParams(params))}"

sortParams = (params) ->
  sorted = {}
  _.chain(params)
    .keys()
    .sort()
    .forEach (key) ->
      sorted[key] = params[key]

  sorted
