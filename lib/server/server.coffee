#
# Home of the main server object
#
express = require('express')
_ = require('underscore')
async = require('async');
env = require('../config/environments/env');
router = require('./router')
logger = require('../lib/logger')
statsd = require('../lib/statsd')
dataAdapter = require('./data_adapter')
airRequest = require('../lib/airRequest')
assetCompiler = require('../lib/assetCompiler')
helper = require('../app/helpers/helper')
mw = require('./middleware')
gzippo = require('gzippo')

# Module variables
app = express()
isShuttingDown = false
FATAL_EXIT_CODE = 13

#
# Initialize our server
#
module.exports.init = (options, callback) ->
  initMiddleware()
  router.buildRoutes(app)
  initLibs(callback)
  loadCache (err, results) ->
    # don't wait for loadCache callback

#
# options
# - port
#
module.exports.start = (options, callback) ->
  port = 3000
  port = options.port if (options && options.port)
  app.listen port, undefined, (callback) ->
    if (app.settings.env != 'test')
      console.log("server listening on port #{port} in #{app.settings.env} mode")


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

#
# Initialize middleware stack
#
initMiddleware = () ->
  app.configure () ->
    app.set('views', __dirname + '/../app/views')
    app.set('view engine', 'coffee')
    app.engine('coffee', require('./view_engine'))
    app.use(express.bodyParser())
    app.use(express.cookieParser())
    app.use(gzippo.compress({filter:compressFilter}));
    app.use(express.methodOverride())
    app.use(express.static(__dirname + '/../public'))
    app.use(mw.startRequest())
    app.use(mw.createAppInstance())
    app.use(mw.getAccessToken())
    app.use(mw.userConfig())
    app.use(app.router)
    # app.use(mw.logResponse())
    app.use('/api', router.apiProxy())

  app.configure 'test', () ->
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))

  app.configure 'development', () ->
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))

  app.configure 'production', () ->
    app.use(express.errorHandler())


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

  if (env.current.zookeeper && env.current.zookeeper.enabled)
    zk = require('../lib/zk')
    libs.zk = (cb) ->
      zk.init(env.current.zookeeper, logger, cb)

  async.parallel libs, (err, results) ->
    logger.debug("initlibs complete")
    return callback(err, results)

#
# Library cleanup
#
closeLibs = (callback) ->
  callback()

#
# preload our cache
#
loadCache = (callback) ->
  batched =
    currencies: (cb) -> helper.currencies(cb)
    locales: (cb) -> helper.locales(cb)
  async.parallel batched, callback

# CompressFilter is used by gzippo to determine which file types to compress
compressFilter = (req, res) ->
  type = res.getHeader('Content-Type') || ''
  # return type.match(/json|text|javascript/);
  return type.match(/json|text/)

