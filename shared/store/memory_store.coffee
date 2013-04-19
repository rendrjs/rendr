module.exports = class MemoryStore
  cacheVersion: ''

  constructor: (@options = {}) ->
    @app = @options.app
    @cache = {}

  get: (key) ->
    return undefined unless key

    data = @_get(key)
    if data && data.expires && Date.now() > data.expires
      console?.log "MemoryStore: Expiring key \"#{key}\"."
      @clear(key)
      data = undefined
    else if data && data.value
      data = data.value

    return data

  set: (key, value, ttlSec) ->
    return false unless key
    return false if value is undefined

    expires = if ttlSec then (Date.now() + ttlSec*1000) else undefined
    @_set(key, {value, expires})
    return true

  _get: (key) ->
    @cache[@_formatKey(key)]

  _set: (key, data) ->
    @cache[@_formatKey(key)] = data

  _clear: (key) ->
    delete @cache[@_formatKey(key)]

  _clearAll: ->
    @cache = {}

  clear: (key) ->
    if key?
      @_clear(key)
    else
      @_clearAll()

  _versionKey: (key) ->
    "#{key}:#{@cacheVersion}"

  _formatKey: (key) ->
    @_versionKey(key)
