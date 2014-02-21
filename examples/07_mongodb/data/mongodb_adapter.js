var db = require('config').db,
    DataAdapter = require('rendr/server/data_adapter'),
    UserModel = require('./user_dao'),
    RepositoryModel = require('./repository_dao'),
    _ = require('underscore'),
    debug = require('debug')('rendr:MongodbAdapter'),
    util = require('util'),
    mongoose = require('mongoose');

module.exports.initDB = initDB;
module.exports.MongodbAdapter = MongodbAdapter;
module.exports.get = get;
module.exports.query = query;

//
// Initialize DB connection.
//
function initDB() {
  var uri = 'mongodb://' + (db.user && db.password ? db.user + ':' +
            db.password + '@' : '')
            + db.host + (db.port ? ':' + db.port : '')
            + '/' + db.name;
 
  mongoose.connect(uri, db.options);

  var connection = mongoose.connection;

  connection.once('open', function () {
    console.log('Connected to ' + uri);
  });

  connection.on('error', console.error.bind(console, 'Connection Error:'));

  connection.on('disconnected', function () {
    mongoose.connect(uri, db.options);
    console.log('Reconnected to ' + uri);
  });
}

function MongodbAdapter(options) {
  DataAdapter.call(this, options);

  if (!options.mapper) {
    throw "mapper must be defined";
  }

  this.mapper = options.mapper;

  /**
   * Default options.
   */
  _.defaults(this.options, {
    userAgent: 'Rendr MongodbAdapter; Node.js'
  });
}

util.inherits(MongodbAdapter, DataAdapter);


/**
 * `request`
 *
 * This is method that Rendr calls to ask for data.
 *
 * `req`: Actual request object from Express/Connect.
 * `api`: Object describing API call; properties including 'path', 'query', etc.
 *        Passed to `url.format()`.
 * `options`: (optional) Options.
 * `callback`: Callback.
 */
MongodbAdapter.prototype.request = function(req, api, options, callback) {
  /**
   * Allow for either 3 or 4 arguments; `options` is optional.
   */
  if (arguments.length === 3) {
    callback = options;
    options = {};
  }

  this.mapper(api.path, function (err, f, model, criteria) {
    if (err) {
      return callback(err);
    }

    /**
     * Request timing.
     */
    var start = new Date().getTime();

    f(model, criteria, function (err, body) {
      debug('Query %s %s %sms', model.modelName, criteria, new Date().getTime() - start);

      // prepare response object
      var response = {
        statusCode: err ? 500 : 200
      };

      callback(err, response, body);
    });
  });
};

//
// Find one document matching criteria.
//
function get(model, criteria, callback) {
  model.findOne(criteria).exec(function(err, body) {
    callback(err, body);
  });
}

//
// Query documents by criteria.
// Query all documents if criteria is empty.
//
function query(model, criteria, callback) {
  model.find(criteria).exec(function(err, body) {
    callback(err, body);
  });
}
