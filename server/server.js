require('../shared/globals');

var _ = require('underscore')
  , express = require('express')
  , Router = require('./router')
  , RestAdapter = require('./data_adapter/rest_adapter')
  , ViewEngine = require('./viewEngine')
  , middleware = require('./middleware');

module.exports = Server;

var defaultOptions = {
  dataAdapter: null,
  dataAdapterConfig: null,
  viewEngine: null,
  router: null,
  errorHandler: null,
  notFoundHandler: null,
  dumpExceptions: false,
  stashError: null,
  apiPath: '/api',
  appData: {},
  paths: {},
  viewsPath: null
};


function Server(options) {
  this.options = options || {};
  _.defaults(this.options, defaultOptions);

  this.expressApp = express();

  this.dataAdapter = this.options.dataAdapter || new RestAdapter(this.options.dataAdapterConfig);;

  this.viewEngine = this.options.viewEngine || new ViewEngine();

  this.errorHandler = this.options.errorHandler =
    this.options.errorHandler || middleware.errorHandler(this.options);

  this.router = new Router(this.options);

  /**
   * Tell Express to use our ViewEngine to handle .js, .coffee files.
   * This can always be overridden in your app.
   */
  this.expressApp.set('views', this.options.viewsPath || (process.cwd() + '/app/views'));
  this.expressApp.set('view engine', 'js');
  this.expressApp.engine('js',     this.viewEngine.render);
  this.expressApp.engine('coffee', this.viewEngine.render);

  this._configured = false;

  /**
  * This is the middleware handler used to mount the Rendr server onto an Express app.
  */
  this.__defineGetter__('handle', function() {
    return function(req, res, next) {
      /**
      * Lazily configure the Express app, so the calling application doesn't have to
      * call `configure()` if it doesn't have any custom middleware.
      */
      if (!this._configured) this.configure();

      this.expressApp.handle(req, res, next);
    }.bind(this);
  });
}

/**
 * Attach Rendr's routes to the Express app and setup the middleware stack.
 * Pass `fn` in order to add custom middleware that should access `req.rendrApp`.
 */
Server.prototype.configure = function(fn) {
  var apiPath = this.options.apiPath
    , notApiRegExp = new RegExp('^(?!' + apiPath.replace('/', '\\/') + '\\/)');

  this._configured = true;

  /**
   * First, initialize the Rendr app, accessible at `req.rendrApp`.
   */
  this.expressApp.use(middleware.initApp(this.options.appData));

  /**
   * Add any custom middleware that has to access `req.rendrApp` but should run before
   * the Rendr routes
   */
  fn && fn(this.expressApp);

  /**
   * Add the API handler.
   */
  this.expressApp.use(this.options.apiPath, middleware.apiProxy());

  /**
   * Add the routes for everything defined in our routes file.
   */
  this.buildRoutes();

  /**
   * If a 404 handler is provided, use it for all non-API routes.
   */
  if (this.options.notFoundHandler) {
    this.expressApp.get(notApiRegExp, this.options.notFoundHandler);
  }
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
