var utils, _, fs;

_ = require('underscore');
fs = require('fs');

utils = module.exports = {};

utils.isErrorStatus = function(statusCode, options) {
  options = options || {};
  _.defaults(options, {
    allow4xx: false
  });
  statusCode = +statusCode;
  if (options.allow4xx) {
    return statusCode >= 500 && statusCode < 600;
  } else {
    return statusCode >= 400 && statusCode < 600;
  }
};

utils.walk = function(dir, callback) {
  var results = [];

  fs.readdir(dir, function(err, list) {
    if (err) return callback(err);

    var pending = list.length;
    if (!pending) return callback(null, results);

    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) { callback(null, results); }
          });
        } else {
          results.push(file);
          if (!--pending) { callback(null, results); }
        }
      });
    });
  });
};