var router = require('./router');
var env = require('../config/environments/env');
var assetCompiler = require('./lib/assetCompiler');

module.exports.dataAdapter = null;


// ===== VIEWS =====

module.exports.viewConfig =  {
  engineName: 'coffee',
  engine:require('./view_engine'),
  viewDir: env.paths.viewDir,
  publicDir: env.paths.publicDir,
  apiPath:'/api'
}


// ===== ROUTES =====

module.exports.buildRoutes = function(server) {
  return router.buildRoutes(server);
}


// ===== MIDDLEWARE =====

createAppInstance = function() {
  return function(req, res, next) {
    var App = require(env.paths.entryPath + "/app")  // moweb/app/app.coffee
    req.appContext = new App;
    next();
  }
}


module.exports.addMiddleware = function(server) {
  server.use(createAppInstance());
}


// ===== LIBRARIES =====

/**
  - options
    - logger
    - dataAdapter
*/
module.exports.initLibs = function(options, callback) {
  if (!options) options = {};

  module.exports.dataAdapter = options.dataAdapter;

  if (env.current.assetCompiler && env.current.assetCompiler.enabled) {
    assetCompiler.init(env.current.assetCompiler, options.logger, function(err) {
      if (err) return callback(err);
      assetCompiler.compile(callback);
    });
  } else {
    callback()
  }
}

module.exports.closeLibs = function(callback) {
  callback();
}

