Router = require('./router')
viewEngine = require('./viewEngine')

# ===== SHARED =====

exports.dataAdapter = null

exports.initGlobals = ->
  global._ = require('underscore')
  global.Backbone = require('backbone')
  global.Handlebars = require('handlebars')
  global.rendr = {} if !global.rendr
  if config && config.paths && config.paths.entryPath
    global.rendr.entryPath = config.paths.entryPath
  else
    # if we don't have entry path, guess
    global.rendr.entryPath = process.env.PWD + '/app'


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

  exports.initGlobals()

  # router
  try
    exports.router = new Router(config)
  catch err
    return callback(err)

  callback()



# ===== VIEWS =====

exports.viewConfig =
  engineName: 'coffee'
  engine: viewEngine.engine
