require('../shared/globals');

var _ = require('underscore')
  , Router = require('./router')
  , RestAdapter = require('./data_adapter/rest_adapter')
  , ViewEngine = require('./viewEngine')
  , middleware = require('./middleware');

module.exports = Server;

function Server(options) {
  this.options = options || {};
  _.defaults(this.options, this.defaultOptions);

  this.initialize();
}

Server.prototype.defaultOptions = {
  dataAdapter: null,
  dataAdapterConfig: null,
  viewEngine: null,
  router: null,
  errorHandler: null,
  dumpExceptions: false,
  notFoundHandler: null,
  stashError: null,
  apiPath: '/api',
  paths: {}
};

Server.prototype.initialize = function() {
  this.dataAdapter = this.options.dataAdapter || new RestAdapter(this.options.dataAdapterConfig);;

  this.viewEngine = this.options.viewEngine || new ViewEngine();

  this.errorHandler = this.options.errorHandler = this.options.errorHandler ||
    middleware.errorHandler(this.options);

  this.router = new Router(this.options);
};

/**
 * Attach Rendr's routes to the Express app.
 *
 * The second argument is the middleware stack to use in front of every Rendr action and
 * every API request which is proxied through `apiProxy`. We provide a default.
 */
Server.prototype.attachRoutes = function(expressApp, stack) {

  /**
   * The default stack is very simple; we just initialize the Rendr app.
   */
  stack = stack || [
    middleware.initApp(this.options.appData)
  ];

  /**
   * First, we'll add the routes for everything defined in our routes file,
   * plus the handler for our API proxy endpoint.
   */
  this.buildRendrRoutes(expressApp, stack);
  this.buildApiRoutes(expressApp, stack);

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
  expressApp.set('views', rendr.entryPath + '/app/views');
  expressApp.set('view engine', 'js');
  expressApp.engine('js',     this.viewEngine.render);
  expressApp.engine('coffee', this.viewEngine.render);
};

Server.prototype.buildApiRoutes = function(expressApp, stack) {
  var fnChain = stack.concat(middleware.apiProxy())
    , apiPath = this.options.apiPath;

  fnChain.forEach(function(fn) {
    expressApp.use(apiPath, fn);
  });
};

Server.prototype.buildRendrRoutes = function(expressApp, stack) {
  var routes, path, definition, fnChain;

  routes = this.router.buildRoutes();
  routes.forEach(function(args) {
    path = args.shift();
    definition = args.shift();

    // Additional arguments are more handlers.
    fnChain = stack.concat(args);

    // Have to add error handler AFTER all other handlers.
    fnChain.push(this.errorHandler);

    // Attach the route to the Express server.
    expressApp.get(path, fnChain);
  }, this);
};
