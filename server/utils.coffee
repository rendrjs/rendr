# These are methods/functionality that are passed down from the
# server to the rendr lib
#

config = null

exports.init = (conf) ->
  config = conf

exports.stashPerf = (req, name, value) ->
  if (config && config.stashPerf)
    config.stashPerf(req, name, value)

exports.stashError = (req, err) ->
  if (config && config.stashError)
    config.stashError(req, err)
  else
    console.log("rendr.server.utils: missing stashError")

exports.phrases = (locale, callback) ->
  if (config && config.phrases)
    config.phrases(locale, callback)
  else
    console.log("rendr.server.utils: missing phrases")

exports.currencies = (callback) ->
  if (config && config.currencies)
    config.currencies(callback)
  else
    console.log("rendr.server.utils: missing currencies")

exports.locales = (callback) ->
  if (config && config.locales)
    config.locales(callback)
  else
    console.log("rendr.server.utils: missing locales")

exports.rendrProperties = () ->
  properties = null
  if (config && config.properties)
    properties = config.properties
  return properties
