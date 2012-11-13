if (!this.window) {
  require('coffee-script');
  module.exports.server = require('./server/server'); 
} 
//module.exports.entryPath = module.parent.filename.replace(/\/[^\/]*$/, '') + '/app';
module.exports.entryPath = require('./config/environments/paths').entryPath;
global.rendr = module.exports;

