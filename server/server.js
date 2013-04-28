var Router, config;

require('../shared/globals');
Router = require('./router');

/*
* config keys:
*   - dataAdapter
*   - errorHandler
*   - stashError
*   - paths
*     - entryPath
*/
config = null;

exports.dataAdapter = null;

exports.router = null;

exports.init = function(conf, callback) {
  config = conf || {};

  // verify dataAdapter
  if (!config.dataAdapter) {
    return callback(new Error("Missing dataAdapter"));
  }
  exports.dataAdapter = config.dataAdapter;

  try {
    exports.router = new Router(config);
  } catch (err) {
    return callback(err);
  }
  callback();
};
