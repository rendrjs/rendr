router = require('./router')
utils = require('./utils')
viewEngine = require('./view_engine')
env = require('../config/environments/env')
async = require('async')
Polyglot = require('node-polyglot')

exports.dataAdapter = null
exports.errorHandler = null

# ===== VIEWS =====

exports.viewConfig =
  engineName: 'coffee'
  engine: viewEngine.engine
  viewDir: env.paths.viewDir
  publicDir: env.paths.publicDir
  apiPath:'/api'

# ===== ROUTES =====

exports.routes = () ->
  router.routes()

# ===== MIDDLEWARE =====

initGlobals = () ->
  (req, res, next) ->
    # YUCK!
    App = require(env.paths.entryPath + "/app")
    next()

exports.middleware = () ->
  [ initGlobals() ]

# ===== LIBRARIES =====

# - options
#   - logger
#   - dataAdapter
exports.initLibs = (options, callback) ->
  options = {} if (!options)

  utils.init(options)
  exports.dataAdapter = options.dataAdapter
  router.errorHandler = options.errorHandler
  callback()

exports.closeLibs = (callback) ->
  callback()
