require('../shared/globals')
Router = require('./router')

# ===== SHARED =====

exports.dataAdapter = null

# ===== CONFIG =====

config = null

# - options
#   - dataAdapter
#   - errorHandler
#   - stashError
#   - paths
#     - entryPath

exports.router = null

exports.init = (conf, callback) ->
  config = conf

  # verify dataAdapter
  if !config || !config.dataAdapter
    return callback(new Error("Missing dataAdapter"))
  exports.dataAdapter = config.dataAdapter

  # router
  try
    exports.router = new Router(config)
  catch err
    return callback(err)

  callback()
