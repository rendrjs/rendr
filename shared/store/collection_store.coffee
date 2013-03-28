MemoryStore = require('./memory_store')
modelUtils = require('../modelUtils')

module.exports = class CollectionStore extends MemoryStore

  set: (collection, params = null) ->
    params ||= collection.params
    key = getStoreKey(modelUtils.modelName(collection.constructor), params)
    idAttribute = collection.model.prototype.idAttribute
    data =
      ids: collection.pluck(idAttribute)
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
