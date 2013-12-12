/**
 * We add `req.rendrApp` so any middleware can access the Rendr
 * app. We need to inject it into views, models, etc., in order
 * to provide user-specific functionality, such as sessions.
 * We can't just access it as a global, because there are concurrent
 * requests for different users.
 */

var _ = require('underscore');

module.exports = function(appAttributes, options) {
  options = options || {};
  return function(req, res, next) {
    var App = require(options.entryPath + 'app/app');

    /**
     * Pass any data that needs to be accessible by the client
     * and server into the app as `appAttributes`.
     * Pass any non-app-data config using `appOptions`.
     */
    var appOptions = {
      /**
       * Hold on to a copy of the original request, so we can pull headers, etc.
       * This will only be accessible on the server.
       */
      req: req,
      entryPath: options.entryPath,
      modelUtils: options.modelUtils
    };

    /**
     * Allow `appAttributes` to be a function for lazy-instantiation based on `req` and `res`.
     */
    function getAppAttributes(attrs, req, res) {
      if (typeof attrs === 'function') {
        attrs = attrs(req, res);
      }
      return attrs || {};
    }

    var attributes = getAppAttributes(appAttributes, req, res);

    _.extend(attributes, {
      /**
       * Pass through `apiPath` so models and collections can properly fetch from the
       * correct path.
       */
      apiPath: options.apiPath
    });

    var app = new App(attributes, appOptions);

    /**
     * Stash the app instance on the request so can be accessed in other middleware.
     */
    req.rendrApp = app;

    next();
  };
};
