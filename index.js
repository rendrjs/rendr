require('coffee-script')

exports.entryPath = module.parent.filename.replace(/\/[^\/]*$/, '');

global.rendr = module.exports;

exports.server = require('./lib/server/server');
exports.BaseModel = require('./lib/base_model');
exports.BaseCollection = require('./lib/base_collection');
exports.BaseView = require('./lib/base_view');
