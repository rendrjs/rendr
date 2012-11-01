require('coffee-script')

exports.entryPath = module.parent.filename.replace(/\/[^\/]*$/, '');

global.rendr = module.exports;

exports.server = require('./lib/server/server');
exports.App = require('./lib/shared/app');
exports.BaseModel = require('./lib/shared/base_model');
exports.BaseCollection = require('./lib/shared/base_collection');
exports.BaseView = require('./lib/shared/base_view');
exports.ClientRouter = require('./lib/client/router');
