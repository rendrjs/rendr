router = require('./router')
viewEngine = require('./view_engine')
async = require('async')

# ===== SHARED =====

exports.dataAdapter = null

exports.initGlobals = () ->
  global._ = require('underscore')
  global.Backbone = require('backbone')
  global.Handlebars = require('handlebars')
  global.rendr = {} if (!global.rendr)
  global.rendr.entryPath = config.paths.entryPath
  global.rendr.manifestDir = config.paths.publicDir


# ===== CONFIG =====

config = null

# - options
#   - dataAdapter
#   - errorHandler
#   - stashError
#   - stashPerf
#   - paths
#     - entryPath
#     - publicDir
exports.init = (conf, callback) ->
  config = conf

  # verify dataAdapter (apiProxy)
  if (!config || !config.dataAdapter)
    return callback("Missing dataAdapter")
  exports.dataAdapter = config.dataAdapter

  # verify paths
  if (!config.paths || !config.paths.entryPath || !config.paths.publicDir)
    return callback("Missing entryPath or publicDir")
  exports.initGlobals()

  # router
  router.init(config, callback)


# ===== VIEWS =====

exports.viewConfig =
  engineName: 'coffee'
  engine: viewEngine.engine

# ===== ROUTES =====

# call init first!
exports.routes = () ->
  router.routes()

