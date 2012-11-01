/**
  Provide simple cache interface for application (currently in memory, but could be swapped out with somehting else)
*/

var appCache = {};

/**
  Get value from cache, return via callback(err, value)
*/
module.exports.get = function(key, callback) {
  if (!key) return callback("missing key");

  var data = appCache[key];
  if (data && data.expires && (Date.now() > data.expires)) {
    delete appCache[key];
    data = undefined;
  }

  if (data && data.value) {
    // cache hit, return value
    return callback(undefined, data.value);
  } else {
    // cache miss 
    return callback();  
  }
}


/**
  Set value in cache
  - key
  - value
  - ttlSec optional -- time to live in seconds
  - callback(err)
*/
module.exports.set = function(key, value, ttlSec, callback) {
  if (!key || !value) return callback("missing key or value");

  var expiration = ttlSec ? (Date.now() + ttlSec*1000) : undefined;
  appCache[key] = {value:value, expires:expiration};
  if (callback) return callback();
}

/**
  Clear value in cache
*/
module.exports.clear = function(key) {
  if (key && appCache.key) {
    delete appCache.key;
  }
}