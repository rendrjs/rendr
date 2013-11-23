if (!this.window) {
  var Server = require('./server/server')

  exports.Server = Server

  exports.createServer = function(options) {
    return new Server(options);
  };
}
