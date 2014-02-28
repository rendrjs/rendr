var express = require('express')
  , rendr = require('rendr')
  , config = require('config')
  , mw = require('./server/middleware')
  , app = express();

/**
 * Initialize Express middleware stack.
 */
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(express.logger());
app.use(express.bodyParser());

/**
 * Initialize our Rendr server.
 */
var server = rendr.createServer({
  dataAdapterConfig: config.api,
  appData: config.appData
});

/**
 * The `addLocaleToRequest` middleware can go outside of a `server.configure()` block
 * because it doesn't access `req.rendrApp`. This example middleware just adds a
 * `req.locale` property based on the query string. Because the same exact `req`
 * object is passed to each middleware, any middleware that follow
 * `addLocaleToRequest` can access `req.locale`, including the middleware added to
 * the Rendr server's internal Express app in a `server.configure()` block.
 */
app.use(mw.addLocaleToRequest());

/**
 * Demonstrate how to use Express' `res.locals` to pass additional data to the
 * layout template. You can see how this value is used in the layout file,
 * `app/templates/__layout.hbs`. You can also use Express' `app.locals` for
 * values that are not request-specific.
 */
app.use(function(req, res, next) {
  res.locals.repoUrl = 'https://github.com/rendrjs/rendr';
  next();
});

/**
  * To mount Rendr, which owns its own Express instance for better encapsulation,
  * simply add `server` as a middleware onto your Express app.
  * This will add all of the routes defined in your `app/routes.js`.
  * If you want to mount your Rendr app onto a path, you can do something like:
  *
  *     app.use('/my_cool_app', server);
  */
app.use(server);

server.configure(function(rendrExpressApp) {
  /**
   * The `fetchDataForApp` middleware has to go in a `server.configure()` block
   * because it access `req.rendrApp`, which is equivalent to `this.app` in your
   * models, views, and controllers.
   */
  rendrExpressApp.use(mw.fetchDataForApp({apiKeyForFakeService: 'sup3rs3cr3t'}));
});


/**
 * Start the Express server.
 */
function start(){
  var port = process.env.PORT || config.server.port;
  app.listen(port);
  console.log("server pid %s listening on port %s in %s mode",
    process.pid,
    port,
    app.get('env')
  );
}


/**
 * Only start server if this script is executed, not if it's require()'d.
 * This makes it easier to run integration tests on ephemeral ports.
 */
if (require.main === module) {
  start();
}

exports.app = app;
