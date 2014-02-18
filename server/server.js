var _ = require('underscore'),
    express = require('express'),
    Router = require('./router'),
    RestAdapter = require('./data_adapter/rest_adapter'),
    ViewEngine = require('./viewEngine'),
    middleware = require('./middleware');

module.exports = Server;

function defaultOptions() {
  return {
    dataAdapter: null,
    dataAdapterConfig: null,
    viewEngine: null,
    errorHandler: null,
    notFoundHandler: null,
    mountPath: null,
    apiPath: '/api',
    appData: {},
    paths: {},
    viewsPath: null,
    defaultEngine: 'js',
    entryPath: process.cwd() + '/',
    apiProxy: null
  };
}


function Server(options) {
  this.options = options || {};

  if (typeof rendr !== 'undefined' && rendr.entryPath) {
    console.warn("Setting rendr.entryPath is now deprecated. Please pass in \nentryPath when initializing the rendr server.");
    this.options.entryPath = rendr.entryPath;
  }

  _.defaults(this.options, defaultOptions());

  this.expressApp = express();

  this.dataAdapter = this.options.dataAdapter || new RestAdapter(this.options.dataAdapterConfig);

  this.initApp = middleware.initApp;

  this.viewEngine = this.options.viewEngine || new ViewEngine();

  this.errorHandler = this.options.errorHandler =
    this.options.errorHandler || express.errorHandler();

  this.router = new Router(this.options);

  /**
   * Tell Express to use our ViewEngine to handle .js, .coffee files.
   * This can always be overridden in your app.
   */
  this.expressApp.set('views', this.options.viewsPath || (this.options.entryPath + 'app/views'));
  this.expressApp.set('view engine', this.options.defaultEngine);
  this.expressApp.engine(this.options.defaultEngine, this.viewEngine.render);

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
  var dataAdapter = this.dataAdapter,
      apiPath = this.options.apiPath,
      notApiRegExp = new RegExp('^(?!' + apiPath.replace('/', '\\/') + '\\/)');

  this._configured = true;

  /**
   * Attach the `dataAdapter` to the `req` so that the `syncer` can access it.
   */
  this.expressApp.use(function(req, res, next) {
    req.dataAdapter = dataAdapter;

    /**
     * Proxy `res.end` so we can remove the reference to `dataAdapter` to prevent leaks.
     */
    var end = res.end;
    res.end = function(data, encoding) {
      res.end = end;
      req.dataAdapter = null;
      res.end(data, encoding);
    };
    next();
  });

  /**
   * Initialize the Rendr app, accessible at `req.rendrApp`.
   */
  this.expressApp.use(this.initApp(this.options.appData, {
    apiPath: this.options.apiPath,
    entryPath: this.options.entryPath,
    modelUtils: this.options.modelUtils
  }));

  /**
   * Add any custom middleware that has to access `req.rendrApp` but should run before
   * the Rendr routes
   */
  fn && fn(this.expressApp);

  /**
   * Add the API handler.
   */
  this.options.apiProxy = this.options.apiProxy || middleware.apiProxy;
  this.expressApp.use(this.options.apiPath, this.options.apiProxy(dataAdapter));

  /**
   * Add the routes for everything defined in our routes file.
   */
  this.buildRoutes();

  this.expressApp.use(this.errorHandler);

  /**
   * If a 404 handler is provided, use it for all non-API routes.
   */
  if (this.options.notFoundHandler) {
    this.expressApp.get(notApiRegExp, this.options.notFoundHandler);
  }
};

Server.prototype.buildRoutes = function() {
  var routes = this.router.buildRoutes();

  routes.forEach(function(args) {
    var pattern = args[0],
        route = args[1],
        handler = args[2];

    // Attach the route to the Express server.
    this.expressApp.get(pattern, handler);
  }, this);
};
