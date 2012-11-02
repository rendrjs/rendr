if (!this.window) require('coffee-script');

exports.entryPath = module.parent.filename.replace(/\/[^\/]*$/, '') + '/app';
global.rendr = module.exports;
