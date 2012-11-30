MemoryStore = require('./memory_store')

module.exports = class LocalStorageStore extends MemoryStore

  constructor: ->
    @_keys = {}

  _get: (key) ->
    json = window.localStorage.getItem(formatKey(key))
    data = try
      JSON.parse(json)
    catch e
      null
    data

  _set: (key, data) ->
    json = JSON.stringify(data)
    window.localStorage.setItem(formatKey(key), json)
    @_keys[key] = true

  _clear: (key) ->
    window.localStorage.removeItem(formatKey(key))
    delete @_keys[key]

  _clearAll: ->
    for key, value of @_keys
      window.localStorage.removeItem(formatKey(key))
    @_keys = {}

formatKey = (key) ->
  "_lss:#{key}"
