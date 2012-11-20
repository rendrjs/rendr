if (!this.window) {
  require('coffee-script');
  module.exports.server = require('./server/server');
}
