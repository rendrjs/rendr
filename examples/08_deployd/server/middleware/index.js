var fs = require('fs'),
  path = require('path');

/**
 * This is a convenience for accessing custom middleware functions.
 * Allows code like:
 *
 *     var middleware = require('./server/middleware');
 *     app.use(middleware.myCoolMiddleware);
 *
 * Inspired by the way Express/Connect loads middleware.
 */

fs.readdirSync(__dirname).forEach(function(filename) {
  var name = path.basename(filename, '.js');
  if (name === 'index') return;
  function load() { return require('./' + name); }
  exports.__defineGetter__(name, load);
});
