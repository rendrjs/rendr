require('../shared/globals');

var Router = require('./router')
  , RestAdapter = require('./data_adapter/rest_adapter')
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
  exports.dataAdapter = options.dataAdapter || new RestAdapter(options.dataAdapterConfig);

  exports.viewEngine = options.viewEngine || new ViewEngine();

  try {
    exports.router = new Router(options);
  } catch (err) {
    return callback(err);
  }
  callback();
};
