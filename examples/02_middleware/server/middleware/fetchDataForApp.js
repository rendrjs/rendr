var _ = require('underscore');

/**
 * This example middleware simulates an asynchronous call to fetch data from
 * an external resource and then sets it as an attribute on the Rendr app,
 * which can then be accessed in Rendr models, views, and controllers on
 * both the client and the server side.
 */

module.exports = function fetchDataForApp(options) {
  options = options || {};

  _.defaults(options, {
    apiKeyForFakeService: 'abcdefg1234567'
  });

  return function fetchDataForApp(req, res, next) {
    /**
     * We can access `req.rendrApp` only if this middleware is added to the
     * middleware stack of the Rendr server's Express app. In other words,
     * only if it's added within a `server.configure()` block like:
     *
     *    var app = express()
     *      , server = rendr.createServer({...});
     *
     *    app.use(server);
     *
     *    server.configure(function(rendrExpressApp) {
     *      rendrExpressApp.use(mw.fetchDataForApp({
     *        apiKeyForFakeService: 'xxxx'
     *      }));
     *    });
     *
     * Then, in a model, view, or controller, you can access this value like:
     *
     *     var value = this.app.get('fakeServiceCall');
     */

    var app = req.rendrApp;

    /**
     * Simulate asynchronous external call.
     */
    fakeServiceCall(options.apiKeyForFakeService, function(err, serviceResponse) {
      if (err) return next(err);
      app.set('fakeServiceCall', serviceResponse);
      next();
    });
  };
};

function fakeServiceCall(apiKey, callback) {
  /**
   * You would make a service call using `apiKey`.
   */

  var serviceResponse = {
    count: 2,
    values: [
      123456,
      987654
    ]
  };

  /**
    * Simulate asynchronous call.
    */
  process.nextTick(function() {
    callback(null, serviceResponse);
  });
}
