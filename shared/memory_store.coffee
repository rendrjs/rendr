module.exports = class MemoryStore

  constructor: ->
    @cache = {}

  get: (key) ->
    return undefined unless key

    data = @cache[key]
    if data && data.expires && Date.now() > data.expires
      console.log "MemoryStore: Expiring key \"#{key}\"."
      @clear(key)
      data = undefined
    else if data && data.value
      data = data.value

    return data

  set: (key, value, ttlSec) ->
    return false unless key
    return false if value is undefined

    expires = if ttlSec then (Date.now() + ttlSec*1000) else undefined
    @cache[key] = {value, expires}
    return true


  clear: (key) ->
    if key?
      delete @cache[key]
    else
      @cache = {}
