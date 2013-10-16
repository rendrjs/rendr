var express = require('express')
  , config = require('config')
  , app = express()
  , mainApp = require('./apps/main')
  , landingPageApp = require('./apps/landing_page');

/**
 * Initialize Express middleware stack.
 */
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(express.logger());
app.use(express.bodyParser());

/**
 * Mount a simple, self-contained landing page app as an Express sub-app.
 */
app.use('/landing_page', landingPageApp);

/**
 * Mount the Rendr app at the root level.
 */
app.use(mainApp);

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
