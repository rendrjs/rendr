var utils, _, fs, Backbone;

_ = require('underscore');
Backbone = require('backbone');
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

// http://stackoverflow.com/q/5827612/
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
          utils.walk(file, function(err, res) {
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

utils.getApiHost = function(path, apiHostsMap) {
  var extractParamNamesRe = /:(\w+)/g,
      apiHost = null,
      r;

  _.each( apiHostsMap, function(urls, host) {
    _.each(urls, function(url) {
      url = url.substring(0, url.indexOf('?')) || url,
      r = Backbone.Router.prototype._routeToRegExp(url);
      if (r.exec(path)){ return (apiHost = host); }
    });
  });

  return apiHost;
};