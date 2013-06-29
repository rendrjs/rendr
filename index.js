if (!this.window) {
  var Server = require('./server/server')

  exports.Server = Server;

  exports.server = null;

  exports.createServer = function(expressApp, options) {
    return exports.server = new Server(expressApp, options);
  };

  exports.entryPath = process.cwd();
}
