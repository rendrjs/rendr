/**
* This middleware allows accessing the session data from `req.rendrApp`.
* This means that from either the client or server, you can access the session
* data from models, views, and controllers like `this.app.get('session')`.
*/

module.exports = function initSession() {
  return function initSession(req, res, next) {
    var app = req.rendrApp
      , session = req.session;

    /**
     * Let's keep session data stored in a `data` object, so we don't send metadata
     * like `session.cookie` to the client.
     */
    session.data = session.data || {};

    app.set('session', session.data);

    /**
     * Add a convenience method for updating session values, so that
     * `this.app.get('session')` always returns up-to-date values when accessed
     * on the server.
     */
    req.updateSession = function(key, value) {
      session.data[key] = value;
      app.set('session', session.data);
    };

    next();
  };
};
