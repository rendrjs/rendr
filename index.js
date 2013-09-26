if (!this.window) {
  var Server = require('./server/server')

  exports.Server = Server;

  exports.server = null;

  exports.createServer = function(options) {
    return exports.server = new Server(options);
  };

  exports.entryPath = process.cwd();
}
