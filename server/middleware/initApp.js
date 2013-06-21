/*global rendr*/

/**
 * We add 'req.rendrApp' so any middleware can access the Rendr
 * app. We need to inject it into views, models, etc., in order
 * to provide user-specific functionality, such as sessions.
 * We can't just access it as a global, because there are concurrent
 * requests for different users.
*/
module.exports = function(appAttributes) {
  appAttributes = appAttributes || {};
  return function(req, res, next) {
    var App, app;

    App = require(rendr.entryPath + '/app/app');

    // Pass any config that needs to be accessible by the client
    // and server into the app.
    app = new App(appAttributes);

    // Hold on to a copy of the original request, so we can pull headers, etc.
    app.req = req;

    // call post initialize after we have req
    app.postInitialize();

    // Stash on the request so can be accessed elsewhere.
    req.rendrApp = app;

    next();
  };
};
