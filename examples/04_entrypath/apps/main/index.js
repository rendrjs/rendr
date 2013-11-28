var rendr = require('rendr')
  , config = require('config');


/**
 * Initialize our Rendr server and export it, so it can be used as a middleware
 * by our top-level `index.js`.
 */
module.exports = rendr.createServer({
  dataAdapterConfig: config.api,
  appData: config.appData,
  /**
   * Have to set the `entryPath` so Rendr knows where to look for modules.
   */
  entryPath: __dirname + '/'
});
