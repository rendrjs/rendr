#
# Home of the main server object
#
express = require('express')
_ = require('underscore')
async = require('async')
env = require('../config/environments/env')
router = require('./router')
logger = require('./lib/logger')
statsd = require('./lib/statsd')
dataAdapter = require('./data_adapter')
airRequest = require('./lib/airRequest')
assetCompiler = require('./lib/assetCompiler')
mw = require('./middleware')
configureCallbacks = []

# Module variables
server = module.exports.server = express()
isShuttingDown = false
FATAL_EXIT_CODE = 13

#
# Initialize our server
#
module.exports.init = (callback) ->
  initMiddleware()
  router.buildRoutes(server)
  initLibs(callback)

#
# options
# - port
#
module.exports.start = (options, callback) ->
  port = 3000
  port = options.port if (options && options.port)
  server.listen port, undefined, (callback) ->
    if (server.settings.env != 'test')
      console.log("server listening on port #{port} in #{server.settings.env} mode")


stop = module.exports.stop = (exitCode = 0) ->
  isShuttingDown = true
  console.log("stopping server")
  closeLibs (err) ->
    console.log("Error closing libs: #{err}") if (err);
    process.exit(exitCode)


module.exports.shutdown = (errorMessage = "SHUTDOWN") ->
  console.log(errorMessage)
  logger.fatal(errorMessage)
  logger.flush () ->
    stop(FATAL_EXIT_CODE);

module.exports.isShuttingDown = () ->
  isShuttingDown

module.exports.configure = (callback) ->
  configureCallbacks.push(callback)

runUserMiddleware = ->
  callback(server) for callback in configureCallbacks

#
# Initialize middleware stack
#
initMiddleware = ->
  server.configure ->
    server.set('views', rendr.entryPath + '/views')
    server.set('view engine', 'coffee')
    server.engine('coffee', require('./view_engine'))
    server.use(express.compress())
    server.use(express.static(rendr.entryPath + '/../public'))
    server.use(express.logger())
    server.use(express.bodyParser())
    server.use(express.cookieParser())
    server.use(express.methodOverride())
    server.use(mw.startRequest())
    server.use(mw.createAppInstance())

    runUserMiddleware()

    server.use(server.router)
    # server.use(mw.logResponse())
    server.use('/api', apiProxy)

  server.configure 'test', ->
    server.use(express.errorHandler({ dumpExceptions: true, showStack: true }))

  server.configure 'development', ->
    server.use(express.errorHandler({ dumpExceptions: true, showStack: true }))

  server.configure 'production', ->
    server.use(express.errorHandler())

#
# Initialize our libraries
#
initLibs = (callback) ->
  logger.init(env.current.logger)
  statsd.init(env.current.statsd, logger)

  # collect libs to init in parallel
  libs = {}
  libs.api = (cb) ->
    dataAdapter.init(env.current.api, cb)

  libs.airRequest = (cb) ->
    airRequest.init(undefined, logger, statsd, cb)

  if (env.current.assetCompiler && env.current.assetCompiler.enabled)
    libs.assetCompiler = (cb) ->
      assetCompiler.init env.current.assetCompiler, logger, (err) ->
        return cb(err) if err
        assetCompiler.compile(cb)

  async.parallel libs, (err, results) ->
    logger.debug("initlibs complete")
    return callback(err, results)

#
# Library cleanup
#
closeLibs = (callback) ->
  callback()


# middleware handler for intercepting api routes
apiProxy = (req, res, next) ->
  dataAdapter.makeRequest req, (err, response, data) ->
    return next(err) if err
    # Pass through statusCode, but not if it's an i.e. 304.
    if response.statusCode? && _.include(['5', '4'], response.statusCode.toString()[0])
      res.status(response.statusCode)
    res.json(data)
    mw.logline(err, req, res)

