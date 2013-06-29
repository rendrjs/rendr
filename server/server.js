require('../shared/globals');

var Router = require('./router')
  , ViewEngine = require('./viewEngine');

exports.dataAdapter = null;

exports.viewEngine = null;

exports.router = null;

/*
 * Options keys:
 *   - dataAdapter
 *   - errorHandler
 *   - viewEngine
 *   - stashError
 *   - paths
 *     - entryPath
 */
exports.init = function(options, callback) {
  // verify dataAdapter
  if (!options.dataAdapter) {
    return callback(new Error("Missing dataAdapter"));
  }
  exports.dataAdapter = options.dataAdapter;

  exports.viewEngine = options.viewEngine || new ViewEngine();

  try {
    exports.router = new Router(options);
  } catch (err) {
    return callback(err);
  }
  callback();
};
