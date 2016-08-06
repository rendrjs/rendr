var mw = require('./server/middleware'),
  config = require('config'),
  express = require('express'),
  RedisStore = require('connect-redis')(express),
  rendr = require('rendr'),
  app = express();

// Initialize Express middleware stack.
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(express.logger());
app.use(express.bodyParser());

/**
 * The `cookieParser` middleware is required for sessions.
 */
app.use(express.cookieParser());

/**
 * Add session support. This will populate `req.session`.
 */
app.use(express.session({
  secret: config.session.secret,
  store: new RedisStore(config.session.store)
}));

// Initialize our Rendr server
var server = rendr.createServer({
  dataAdapterConfig: config.dataAdapter
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
   * Allow the Rendr app to access session data on client and server.
   * Check out the source in the file `./server/middleware/initSession.js`.
   */
  rendrExpressApp.use(mw.initSession());

  /**
   * Increment a counter in the session on every page hit.
   */
  rendrExpressApp.use(mw.incrementCounter());
});

/**
 * Start the Express server.
 */
function start(){
  var port = process.env.PORT || config.port;
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
