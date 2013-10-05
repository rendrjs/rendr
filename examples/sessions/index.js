var express = require('express')
  , rendr = require('rendr')
  , app = express();

/**
 * Initialize Express middleware stack.
 */
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(express.logger());
app.use(express.bodyParser());

/**
 * In this simple example, the DataAdapter config, which specifies host, port, etc. of the API
 * to hit, is written inline. In a real world example, you would probably move this out to a
 * config file. Also, if you want more control over the fetching of data, you can pass your own
 * `dataAdapter` object to the call to `rendr.createServer()`.
 */
var dataAdapterConfig = {
  'default': {
    host: 'api.github.com',
    protocol: 'https'
  },
  'travis-ci': {
    host: 'api.travis-ci.org',
    protocol: 'https'
  }
};

/**
 * Initialize our Rendr server.
 */
var server = rendr.createServer({
  dataAdapterConfig: dataAdapterConfig
});

/**
 * The `cookieParser` middleware is required for sessions.
 */
app.use(express.cookieParser());

/**
 * Add session support. This will populate `req.session`.
 */
app.use(express.session({
  secret: 'this should be some long random string',

  /**
   * In production apps, you should probably use something like Redis or Memcached
   * to store sessions. Look at the `connect-redis` or `connect-memcached` modules.
   */
  store: null
}));

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
  * Add a middleware that allows accessing the session data from `req.rendrApp`.
  * This means that from either the client or server, you can access the session
  * data like `app.get('session')`.
  */
  rendrExpressApp.use(function(req, res, next) {
    var app = req.rendrApp
      , session = req.session;

    /**
     * Let's keep session data stored in a `data` object, so we don't send metadata like `session.cookie` to the client.
     */
    session.data = session.data || {};

    app.set('session', session.data);

    /**
     * Add a convenience method for updating session values, so that `app.get('session')`
     * always returns up-to-date values when accessed on the server.
     */
    req.updateSession = function(key, value) {
      session.data[key] = value;
      app.set('session', session.data);
    };

    next();
  });

  /**
   * Add a middleware that demonstrates updating session data.
   * Increment a counter for every page hit.
   */
  rendrExpressApp.use(function(req, res, next) {
    var app = req.rendrApp
      , count = app.get('session').count || 0;
    req.updateSession('count', count + 1);
    next();
  });
});

/**
 * Start the Express server.
 */
function start(){
  var port = process.env.PORT || 3030;
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
