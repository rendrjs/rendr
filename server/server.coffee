Router = require('./router')
viewEngine = require('./view_engine')
async = require('async')

# ===== SHARED =====

exports.dataAdapter = null

exports.initGlobals = () ->
  global._ = require('underscore')
  global.Backbone = require('backbone')
  global.Handlebars = require('handlebars')
  global.rendr = {} if (!global.rendr)
  if (config && config.paths)
    global.rendr.entryPath = config.paths.entryPath
    global.rendr.manifestDir = config.paths.publicDir
  else
    # if we don't have entry path, guess
    global.rendr.entryPath = process.env.PWD + '/app'
    global.rendr.manifestDir = global.rendr.entryPath + '/../public'


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

exports.router = null

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
  exports.router = new Router(config, (err) ->
    # Have to do this or else `exports.router` doesn't get set before
    # callback returns.
    process.nextTick ->
      callback(err)
  )


# ===== VIEWS =====

exports.viewConfig =
  engineName: 'coffee'
  engine: viewEngine.engine

# ===== ROUTES =====

# call init first!
exports.routes = ->
  exports.router.routes()
