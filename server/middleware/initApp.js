/*global rendr*/

/**
 * We add `req.rendrApp` so any middleware can access the Rendr
 * app. We need to inject it into views, models, etc., in order
 * to provide user-specific functionality, such as sessions.
 * We can't just access it as a global, because there are concurrent
 * requests for different users.
 */
module.exports = function(appAttributes) {
  return function(req, res, next) {
    var App = require(rendr.entryPath + '/app/app');

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
      req: req
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

    var app = new App(getAppAttributes(appAttributes, req, res), appOptions);

    /**
     * Stash the app instance on the request so can be accessed in other middleware.
     */
    req.rendrApp = app;

    next();
  };
};
