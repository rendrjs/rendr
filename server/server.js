require('../shared/globals');

var _ = require('underscore')
  , Router = require('./router')
  , ViewEngine = require('./viewEngine')
  , middleware = require('./middleware');

module.exports = Server;

function Server(expressApp, options) {
  this.options = options || {};
  _.defaults(this.options, this.defaultOptions);

  this.initialize(expressApp);
}

Server.prototype.defaultOptions = {
  dataAdapter: null,
  viewEngine: null,
  router: null,
  errorHandler: null,
  notFoundHandler: null,
  stashError: null,
  apiPath: '/api',
  paths: {}
};

Server.prototype.initialize = function(expressApp) {
  // verify dataAdapter
  if (!this.options.dataAdapter) {
    throw new Error("Missing dataAdapter");
  }

  this.dataAdapter = this.options.dataAdapter;

  this.viewEngine = this.options.viewEngine || new ViewEngine();

  this.errorHandler = this.options.errorHandler = this.options.errorHandler ||
    middleware.errorHandler(this.options);

  this.router = new Router(this.options);

  /**
   * Set up default middleware stack.
   */
  this.stack = [
    middleware.initApp(this.options.appData)
  ];

  this.initExpress(expressApp);
};

/**
 * Middleware stack

 * This is used in front of every Rendr action and every API request which
 * is proxied through `apiProxy`.
 *
 * We provide a default. Apps can append middleware functions,
 * like `server.stack.push(middlewareFn)`, or swap it out
 * entirely, like `server.stack = [middlewareFn]`.
 */
Server.prototype.stack = null;

/**
 * Attach Rendr's routes to the Express app.
 */
Server.prototype.initExpress = function(expressApp) {
  /**
   * First, we'll add the routes for everything defined in our routes file,
   * plus the handler for our API proxy endpoint.
   */
  this.buildRendrRoutes(expressApp);
  this.buildApiRoutes(expressApp);

  /**
   * Add the 404 handler after all other routes. Make sure not to show a 404
   * for a request to the API proxy.
   */
  var apiPath = this.options.apiPath
    , notApiRegExp = new RegExp('^(?!' + apiPath.replace('/', '\\/') + '\\/)');

  expressApp.get(notApiRegExp, middleware.notFoundHandler());

  /**
   * Tell Express to use our ViewEngine to handle .js, .coffee files.
   * This can always be overridden in your app.
   */
  expressApp.set('views', process.cwd() + '/app/views');
  expressApp.set('view engine', 'js');
  expressApp.engine('js',     this.viewEngine.render);
  expressApp.engine('coffee', this.viewEngine.render);
};

Server.prototype.buildApiRoutes = function(expressApp) {
  var fnChain = this.stack.concat(middleware.apiProxy())
    , apiPath = this.options.apiPath;

  fnChain.forEach(function(fn) {
    expressApp.use(apiPath, fn);
  });
};

Server.prototype.buildRendrRoutes = function(expressApp) {
  var routes, path, definition, fnChain;

  routes = this.router.buildRoutes();
  routes.forEach(function(args) {
    path = args.shift();
    definition = args.shift();

    // Additional arguments are more handlers.
    fnChain = this.stack.concat(args);

    // Have to add error handler AFTER all other handlers.
    fnChain.push(this.errorHandler);

    // Attach the route to the Express server.
    expressApp.get(path, fnChain);
  }, this);
};
