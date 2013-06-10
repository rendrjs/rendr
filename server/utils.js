var _ = require('underscore');

var utils = module.exports = {};

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
