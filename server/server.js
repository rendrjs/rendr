require('../shared/globals');

var _ = require('underscore')
  , express = require('express')
  , Router = require('./router')
  , RestAdapter = require('./data_adapter/rest_adapter')
  , ViewEngine = require('./viewEngine')
  , middleware = require('./middleware');

module.exports = Server;

function Server(expressApp, options) {
  this.options = options || {};
  _.defaults(this.options, this.defaultOptions);

  this.expressApp = express();

  this.dataAdapter = this.options.dataAdapter || new RestAdapter(this.options.dataAdapterConfig);;

  this.viewEngine = this.options.viewEngine || new ViewEngine();

  this.errorHandler = this.options.errorHandler = this.options.errorHandler ||
    middleware.errorHandler(this.options);

  this.router = new Router(this.options);

  this._configure();
}

Server.prototype.defaultOptions = {
  dataAdapter: null,
  dataAdapterConfig: null,
  viewEngine: null,
  router: null,
  errorHandler: null,
  dumpExceptions: false,
  stashError: null,
  apiPath: '/api',
  paths: {}
};

/**
 * A hook provided to configure the Express app, used to initialize middleware, etc.
 */
Server.prototype.configure = function(fn) {
  fn(this.expressApp);
};

/**
 * Attach Rendr's routes to the Express app and setup the middleware stack.
 */
Server.prototype._configure = function() {

  /**
   * First, initialize the Rendr app, accessible at `req.rendrApp`.
   */
  this.expressApp.use(middleware.initApp(this.options.appData));

  /**
   * Add the API handler.
   */
  this.expressApp.use(this.options.apiPath, middleware.apiProxy());

  /**
   * Add the routes for everything defined in our routes file.
   */
  this.buildRoutes();

  /**
   * Tell Express to use our ViewEngine to handle .js, .coffee files.
   * This can always be overridden in your app.
   */
  this.expressApp.set('views', process.cwd() + '/app/views');
  this.expressApp.set('view engine', 'js');
  this.expressApp.engine('js',     this.viewEngine.render);
  this.expressApp.engine('coffee', this.viewEngine.render);
};

Server.prototype.buildRoutes = function() {
  var routes, path, definition, fnChain;

  routes = this.router.buildRoutes();
  routes.forEach(function(args) {
    path = args.shift();
    definition = args.shift();

    // Additional arguments are route handlers.
    fnChain = args;

    // Have to add error handler AFTER all other handlers.
    fnChain.push(this.errorHandler);

    // Attach the route to the Express server.
    this.expressApp.get(path, fnChain);
  }, this);
};
