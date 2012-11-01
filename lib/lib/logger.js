/**
  Plug in desired logger library and functionality here -- use this as an interface
*/

var _ = require('underscore');

var logLevelMap = {
  'debug':0,
  'info':1,
  'warn':2,
  'error':3,
  'fatal':4
}

var config = {
  stdioEnabled: true
}

module.exports.init = function init(options) {
  if (config) {
    _.extend(config, options);
  }
  // convert log level to int
  config.logLevel = logLevelMap[config.logLevel];
}

module.exports.debug = function debug(msg) {
  logMessage('debug', msg);
}

module.exports.info = function info(msg) {
  logMessage('info', msg);
}

module.exports.warn = function warn(msg) {
  logMessage('warn', msg);
}

module.exports.error = function error(msg) {
  logMessage('error', msg);
}

module.exports.fatal = function fatal(msg) {
  logMessage('fatal', msg);
}


module.exports.flush = function flush(callback) {
  return callback();
}

function logMessage(logLevel, msg) {
  if (logLevelMap[logLevel] >= config.logLevel) {
    if (config.stdioEnabled) {
      console.log("%s: %s", logLevel.toUpperCase(), msg);
    }
  }
}