var _ = require('underscore'),
    BaseRouter = require('../shared/base/router'),
    ExpressRouter = require('express').Router,
    sanitizer = require('sanitizer');

module.exports = ServerRouter;

function ServerRouter(options) {
  this._expressRouter = new ExpressRouter();
  this.routesByPath = {};
  this.on('route:add', this.addExpressRoute, this);

  BaseRouter.apply(this, arguments);
  this.initialize(options);
}

/**
 * Set up inheritance.
 */
ServerRouter.prototype = Object.create(BaseRouter.prototype);
ServerRouter.prototype.constructor = ServerRouter;

ServerRouter.prototype.escapeParams = function(params) {
  var escaped = {};
  _.each(params, function(value, key) {
    if (_.isObject(value)) {
      escaped[sanitizer.sanitize(key)] = this.escapeParams(value);
    } else {
      escaped[sanitizer.sanitize(key)] = sanitizer.sanitize(value);
    }
  }, this);
  return escaped;
};

ServerRouter.prototype.getParams = function(req) {
  return this.escapeParams(_.extend({}, req.query, req.params));
};

/**
 * This is the method that renders the request. It returns an Express
 * middleware function.
 */
ServerRouter.prototype.getHandler = function(action, pattern, route) {
  var router = this;

  return function(req, res, next) {
    var params = router.getParams(req),
        redirect = router.getRedirect(route, params),
        app = req.rendrApp,
        context;

    /**
     * If `redirect` is present, then do a redirect and return.
     */
    if (redirect != null) {
      res.redirect(route.status || 301, redirect);
      return;
    }

    context = {
      currentRoute: route,
      app: app,
      redirectTo: function(uri, options) {
        uri = (app.get('rootPath') || '') + uri;
        if (options !== undefined && options.status) {
          res.redirect(options.status, uri);
        }
        else {
          res.redirect(uri);
        }
      }
    };

    action.call(context, params, function(err, viewPath, locals) {
      if (err) return next(err);

      var defaults = router.defaultHandlerParams(viewPath, locals, route);
      viewPath = defaults[0];
      locals = defaults[1];

      var viewData = {
        locals: locals || {},
        app: app,
        req: req
      };

      res.render(viewPath, viewData, function(err, html) {
        if (err) return next(err);
        
        if(!res.get('content-type')) {
            res.type('html');
        }

        res.set(router.getHeadersForRoute(route));
        res.end(html);
      });
    });
  };
};

ServerRouter.prototype.addExpressRoute = function(routeObj) {
  var path = routeObj[0];

  this.routesByPath[path] = routeObj;
  this._expressRouter.route('get', path, []);
};

ServerRouter.prototype.getHeadersForRoute = function(definition) {
  var headers = {};

  if (definition.maxAge != null) {
    headers['Cache-Control'] = "public, max-age=" + definition.maxAge;
  }

  if (definition.headers) {
    _.extend(headers, definition.headers);
  }

  return headers;
};
