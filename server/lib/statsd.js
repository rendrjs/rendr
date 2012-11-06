var StatsD = require('node-statsd').StatsD;
var _ = require('underscore');

var config = {
  host: '127.0.0.1',
  port: 8125,
  project: "moweb-node" // used to prefix key names
};
var client;
var logger;


module.exports.init = function(options, log, callback){
  if (options) _.extend(config, options);

  logger = log;
  client = new StatsD(config.host, config.port);
  if (callback) callback();
};

/**
  We standardize statsd key names by:  [project].[service].[path].[stat]
  Project can be:  "moweb", "moweb-node", "moweb-ruby", or whatever
  Service.Path work together.  Can be "route.index" or "api.search"
  Stat is the stat we are tracking. can be:  count, runtime, error
*/
function buildKey(servicePath) {
  return config.project + '.' + servicePath;
}

/**
  ServicePath should be "<service>.<path>" such as "route.index" or "api.search"
*/
module.exports.timing = function(servicePath, ms) {
  var key = buildKey(servicePath);
  client.timing(key, ms);
  if (logger) logger.info("statsd timing: " + key + ' ' + ms + 'ms');
  return key;
}

/**
  ServicePath should be "<service>.<path>" such as "route.index" or "api.search"
*/
module.exports.increment = function(servicePath) {
  var key = buildKey(servicePath);
  client.increment(key);
  if (logger) logger.info("statsd increment: " + key);
  return key;
}

/**
  ServicePath should be "<service>.<path>" such as "route.index" or "api.search"
*/
module.exports.decrement = function(servicePath) {
  var key = buildKey(servicePath);
  client.decrement(key);
  if (logger) logger.info("statsd decrement: " + key);
  return key;
}

module.exports.guage = function(servicePath) {
  // ????
}
