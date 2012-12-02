router = require('./router')
utils = require('./utils')
viewEngine = require('./view_engine')
env = require('../config/environments/env')
async = require('async')
Polyglot = require('node-polyglot')

exports.dataAdapter = null

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

# createAppInstance = () ->
#   (req, res, next) ->
#     App = require(env.paths.entryPath + "/app")
#     req.rendrApp = new App
#     initApp req.rendrApp, undefined, (err) ->
#       next()

# initApp = (rendrApp, sessionData, callback) ->
#   return callback() if (!rendrApp)

#   # set session manager defaults (locale/currency)
#   locale = 'en'
#   sm = rendrApp.sessionManager
#   if (sm && sessionData)
#     sm.set(sessionData, silent: true)
#     locale = sm.get('locale')

#   rendrApp.set 
#     BRAINTREE_PUBLIC_KEY: "MIIBCgKCAQEAzbPJ+wmXwRC0ITChZPnk67XIund99xrn3+TtbjxsFT3SFJAapb/JKjt6nCtGnkgUaA3lWlFp8QHRRhOYmX8SC/RalCJW3uSLQdXZWfZxMPtGqzlbJzAX92htUnnTzGw1LH23eUN9UWzqkga6TuU5R2RlPbQPGLnN+iYMjE60xb01Ozi2yoCpsNaoe9Wz8xYi3MFPVoURerKA8iCt66kKL51ydRxSNThjvz4+0qgiBlbKtMMKokUh9sPdXj4+012tpm6VFvgmvuHkc8ZYlE9EvdfHNeza2SS2W4NForFai0pvBh+dZozqYa1nHSfjuSmgasX4L60SYAUVQXqOD9IyCQIDAQAB"

#   batched =
#     phrases: (cb) -> utils.phrases(locale, cb)
#     currencies: (cb) -> utils.currencies(cb)
#     locales: (cb) -> utils.locales(cb)
#   async.parallel batched, (err, results) ->
#     return callback(err) if (err)
#     Polyglot.extend(results.phrases)
#     rendrApp.set(results)
#     console.log(">>>>>>>>DONE INIT APP(1)")
#     return callback()


exports.middleware = () ->
  #[ createAppInstance() ]
  [ initGlobals() ]

# ===== LIBRARIES =====

# - options
#   - logger
#   - dataAdapter
exports.initLibs = (options, callback) ->
  options = {} if (!options)

  utils.init(options)
  exports.dataAdapter = options.dataAdapter
  callback()

exports.closeLibs = (callback) ->
  callback()
