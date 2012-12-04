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
