var fs = require('fs'),
    path = require('path');

/**
 * Set up each middleware file in this directory as a property
 * on exports. This means you can require this file and access
 * each middleware like so:
 *
 *   middleware = require('rendr/server/middleware')
 *   expressApp.use(middleware.initApp(attributes))
 */
fs.readdirSync(__dirname).forEach(function(filename) {
  var name = path.basename(filename, '.js');
  if (name === 'index' || name[0] === '_') {
    return;
  }
  function load() {
    return require("./" + name);
  }
  exports.__defineGetter__(name, load);
});
