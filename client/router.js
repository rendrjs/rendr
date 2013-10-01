/*global rendr*/

var AppView, Backbone, BaseRouter, BaseView, ClientRouter, extractParamNamesRe, firstRender, plusRe, _;

_ = require('underscore');
Backbone = require('backbone');
BaseRouter = require('../shared/base/router');
BaseView = require('../shared/base/view');

try {
  AppView = require(rendr.entryPath + 'app/views/app_view');
} catch (e) {
  AppView = require('../shared/base/app_view');
}

extractParamNamesRe = /:(\w+)/g;

plusRe = /\+/g;

firstRender = true;

function noop() {}

module.exports = ClientRouter;

function ClientRouter(options) {
  this._router = new Backbone.Router();
  BaseRouter.apply(this, arguments);
}

/**
 * Set up inheritance.
 */
ClientRouter.prototype = Object.create(BaseRouter.prototype);
ClientRouter.prototype.constructor = ClientRouter;

ClientRouter.prototype.currentFragment = null;

ClientRouter.prototype.previousFragment = null;

/*
 * In a controller action, can access the current route
 * definition with `this.currentRoute`.
 */
ClientRouter.prototype.currentRoute = null;

/*
 * Instance of Backbone.Router used to manage browser history.
 */
ClientRouter.prototype._router = null;

/*
 * We need to reverse the routes in the client because
 * Backbone.History matches in reverse.
 */
ClientRouter.prototype.reverseRoutes = true;

ClientRouter.prototype.initialize = function(options) {
  this.app = options.app;

  // We do this here so that it's available in AppView initialization.
  this.app.router = this;

  this.on('route:add', this.addBackboneRoute, this);
  this.on('action:start', this.trackAction, this);
  this.app.on('reload', this.renderView, this);

  this.appView = new AppView({
    app: this.app
  });

  this.appView.render();
  this.buildRoutes();
  this.postInitialize();
};

ClientRouter.prototype.postInitialize = noop;

/*
 * Piggyback on adding new route definition events
 * to also add to Backbone.Router.
 */
ClientRouter.prototype.addBackboneRoute = function(routeObj) {
  var handler, name, pattern, route;

  pattern = routeObj[0];
  route = routeObj[1];
  handler = routeObj[2];
  name = route.controller + ":" + route.action;

  // Backbone.History wants no leading slash.
  this._router.route(pattern.slice(1), name, handler);
};

ClientRouter.prototype.getHandler = function(action, pattern, route) {
  var router = this;

  // This returns a function which is called by Backbone.history.
  return function() {
    var params, paramsArray, views, redirect;

    router.trigger('action:start', route, firstRender);
    router.currentRoute = route;

    if (firstRender) {
      views = BaseView.attach(router.app);
      router.currentView = router.getMainView(views);
      router.trigger('action:end', route, firstRender);
      firstRender = false;
    } else {
      paramsArray = _.toArray(arguments);
      params = router.getParamsHash(pattern, paramsArray, window.location.search);

      redirect = router.getRedirect(route, params);
      /*
       * If `redirect` is present, then do a redirect and return.
       */
      if (redirect != null) {
        router.redirectTo(redirect, {replace: true});
      } else {
        if (!action) {
          throw new Error("Missing action \"" + route.action + "\" for controller \"" + route.controller + "\"");
        }
        action.call(router, params, router.getRenderCallback(route));
      }
    }
  };
};

/*
 * Can be overridden by applications
 * if the initial render is more complicated.
 */
ClientRouter.prototype.getMainView = function(views) {
  var $content = this.appView.$content;
  return _.find(views, function(view) {
    return view.$el.parent().is($content);
  });
};

/*
 * Proxy to Backbone.Router.
 */
ClientRouter.prototype.navigate = function() {
  this._router.navigate.apply(this._router, arguments);
};

ClientRouter.prototype.getParamsHash = function(pattern, paramsArray, search) {
  var paramNames, params, query;

  paramNames = (pattern.match(extractParamNamesRe) || []).map(function(name) {
    return name.slice(1);
  });
  params = paramNames.reduce(function(memo, name, i) {
    memo[name] = decodeURIComponent(paramsArray[i]);
    return memo;
  }, {});
  query = search.slice(1).split('&').reduce(function(memo, queryPart) {
    var parts = queryPart.split('=');
    if (parts.length > 1) {
      memo[parts[0]] = decodeURIComponent(parts[1].replace(plusRe, ' '));
    }
    return memo;
  }, {});
  return _.extend(query, params);
};

ClientRouter.prototype.matchingRoute = function(path) {
  return _.find(Backbone.history.handlers, function(handler) {
    return handler.route.test(path);
  });
};

ClientRouter.prototype.matchesAnyRoute = function(path) {
  return this.matchingRoute(path) != null;
};

ClientRouter.prototype.redirectTo = function(path, options) {
  var hashParts;

  if (options == null) {
    options = {};
  }
  _.defaults(options, {
    trigger: true,
    pushState: true,
    replace: false
  });

  if (options.pushState === false) {
    // Do a full-page redirect.
    window.location.href = path;
  } else {
    // Do a pushState navigation.
    hashParts = path.split('#');
    path = hashParts[0];

    // But then trigger the hash afterwards.
    if (hashParts.length > 1) {
      this.once('action:end', function() {
        window.location.hash = hashParts[1];
      });
    }

    // Ignore hash for routing.
    this.navigate(path, options);
  }
};

ClientRouter.prototype.handleErr = function(err, route){
  this.trigger('action:error', err, route);
}

ClientRouter.prototype.getRenderCallback = function(route) {
  return function(err, viewPath, locals) {
    if (err) return this.handleErr(err, route);

    var View;

    if (this.currentView) {
      this.currentView.remove();
    }

    var defaults = this.defaultHandlerParams(viewPath, locals, route);
    viewPath = defaults[0], locals = defaults[1];

    locals = locals || {};

    // Inject the app.
    locals.app = this.app;
    View = this.getView(viewPath);
    this.currentView = new View(locals);
    this.renderView();

    this.trigger('action:end', route, firstRender);
  }.bind(this);
};

ClientRouter.prototype.renderView = function() {
  this.appView.setCurrentView(this.currentView);
};

ClientRouter.prototype.start = function() {
  Backbone.history.start({
    pushState: true,
    hashChange: false
  });
};

ClientRouter.prototype.trackAction = function() {
  this.previousFragment = this.currentFragment;
  this.currentFragment = Backbone.history.getFragment();
};

ClientRouter.prototype.getView = function(key) {
  var View = BaseView.getView(key);
  if (!_.isFunction(View)) {
    throw new Error("View '" + key + "' not found.");
  }
  return View;
};
