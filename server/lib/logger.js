
logger = null;

module.exports.init = function(alogger) {
  logger = alogger;
}

module.exports.log = log = function(level, message, options) {
  if (!logger) {
    console.log(message);
  } else {
    logger.log(level, message);
  }
}

module.exports.debug = function(message, options) { log('debug', message, options)}
module.exports.info = function(message, options) { log('info', message, options)}
module.exports.warn = function(message, options) { log('warn', message, options)}
module.exports.error = function(message, options) { log('error', message, options)}

/**
  Return formatted log line
  - options
    - runtime
    - userId
    - requestId
    - err
*/
module.exports.logRequest = function(req, res, options) {
  if (!options) options = {};
  var prefix = (logger && logger.prefix()) ? logger.prefix() : '';
  var runtime = options.runtime || '?';
  var requestId = (typeof options.requestId == 'undefined') ? '' : options.requestId;
  var userId = (typeof options.userId == 'undefined') ? '' : ","+options.userId;
  var maskedUrl = req.originalUrl.replace(/password=[^&?]*/g, "password=***");
  var clientIP = req.headers['client_ip'] || req.connection.remoteAddress  || 'unknown';
  var length = res.body ? res.body.length : 0;

  var info = [prefix + '[' + requestId + userId + ']'];
  info.push(clientIP);
  info.push('"' + req.method + ' ' + maskedUrl + '"'); // req.httpVersion
  info.push(res.statusCode);
  info.push(runtime + 'ms');

  var level = (options.err || res.statusCode > 399) ? 'error' : 'info';
  var message = info.join(' ');
  if (options.err && options.err.stack) {
    message = message + options.err.stack;
  } else if (options.err) {
    message = message + " ERROR: " + err;
  }
  log(level, message);
}
