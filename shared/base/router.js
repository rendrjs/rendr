/*global rendr*/

var Backbone, BaseRouter, noop, _;

_ = require('underscore');
Backbone = require('backbone');

function noop() {}

module.exports = BaseRouter;

/**
 * Base router class shared betwen ClientRouter and ServerRouter.
 */
function BaseRouter(options) {
  this.route = this.route.bind(this);
  this._routes = [];
  this._initOptions(options);
  this.initialize(options);
}

/**
 * Config
 *   - errorHandler: function to correctly handle error
 *   - paths
 *     - entryPath (required)
 *     - routes (optional)
 *     - controllerDir (optional)
 */
BaseRouter.prototype.options = null;

/**
 * Internally stored route definitions.
 */
BaseRouter.prototype._routes = null;

BaseRouter.prototype.reverseRoutes = false;

BaseRouter.prototype.initialize = function(options) {};

BaseRouter.prototype._initOptions = function(options) {
  var paths;

  this.options = options || {};
  paths = this.options.paths = this.options.paths || {};
  paths.entryPath = paths.entryPath || options.entryPath;
  paths.routes = paths.routes || paths.entryPath + 'app/routes';
  paths.controllerDir = paths.controllerDir || paths.entryPath + 'app/controllers';
};

BaseRouter.prototype.getController = function(controllerName) {
  var controllerDir = this.options.paths.controllerDir
    , controller, controllerPath;

  // preload all controllers on the server or in non-AMD env
  // for requirejs return path that will be lazy loaded
  controllerPath = controllerDir + "/" + controllerName + "_controller";

  if (!global.isServer && typeof define !== 'undefined') {
    controller = controllerPath;
  } else {
    controller = require(controllerPath);
  }

  return controller;
};

/**
 * Given an object with 'controller' and 'action' properties,
 * return the corresponding action function.
 */
BaseRouter.prototype.getAction = function(route) {
  var controller, action;
  if (route.controller) {
    controller = this.getController(route.controller);
    if (typeof controller == 'object') {
      action = controller[route.action];
    }
    // In AMD environment controller is path string,
    // which will be loaded when controller is needed.
    else if (typeof controller == 'string') {
      action = controller;
    }
  }
  return action;
};

BaseRouter.prototype.getRedirect = function(route, params) {
  var redirect = route.redirect;
  if (redirect != null) {
    /**
     * Support function and string.
     */
    if (typeof redirect === 'function') {
      redirect = redirect(params);
    }
  }
  return redirect;
};

/**
 * Build route definitions based on the routes file.
 */
BaseRouter.prototype.buildRoutes = function() {
  var routeBuilder = require(this.options.paths.routes)
    , routes = [];

  function captureRoutes() {
    routes.push(_.toArray(arguments));
  }

  try {
    routeBuilder(captureRoutes);
    if (this.reverseRoutes) {
      routes = routes.reverse();
    }
    routes.forEach(function(route) {
      this.route.apply(this, route);
    }, this);
  } catch (e) {
    throw new Error("Error building routes: " + e.stack);
  }
  return this.routes();
};

/**
 * Returns a copy of current route definitions.
 */
BaseRouter.prototype.routes = function() {
  return this._routes.slice().map(function(route) {
    return route.slice();
  });
};

/**
 * Method passed to routes file to build up routes definition.
 * Adds a single route definition.
 */
BaseRouter.prototype.route = function(pattern) {
  var action, definitions, handler, route, routeObj;

  definitions = _.toArray(arguments).slice(1);
  route = this.parseDefinitions(definitions);
  action = this.getAction(route);

  if (!(pattern instanceof RegExp) && pattern.slice(0, 1) !== '/') {
    pattern = "/" + pattern;
  }

  handler = this.getHandler(action, pattern, route);
  routeObj = [pattern, route, handler];
  this._routes.push(routeObj);
  this.trigger('route:add', routeObj);
  return routeObj;
};

BaseRouter.prototype.parseDefinitions = function(definitions) {
  var route;

  route = {};
  definitions.forEach(function(element) {
    var parts;

    /**
     * Handle i.e. 'users#show'.
     */
    if (_.isString(element)) {
      parts = element.split('#');
      _.extend(route, {
        controller: parts[0],
        action: parts[1]
      });
    } else {
      /**
       * Handle objects ,i.e. {controller: 'users', action: 'show'}.
       */
      _.extend(route, element);
    }
  });
  return route;
};

/**
 * Support omitting view path; default it to ":controller/:action".
 */
BaseRouter.prototype.defaultHandlerParams = function(viewPath, locals, route) {
  if (typeof viewPath !== 'string') {
    locals = viewPath;
    viewPath = route.controller + '/' + route.action;
  }
  return [viewPath, locals];
};

/**
 * Methods to be extended by subclasses.
 * -------------------------------------
 */

/**
 * This is the method that renders the request.
 */
BaseRouter.prototype.getHandler = noop;

/**
 * Mix in Backbone.Events.
 */
_.extend(BaseRouter.prototype, Backbone.Events);
