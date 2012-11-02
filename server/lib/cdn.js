var env = require('../../config/environments/env')
  , fingerprint = require('./fingerprint')
  , config = env.current.assets
  , cdnConfig = config.cdn
  , publicDir = config.publicDir
  , timestamp = Date.now()
  ;

module.exports.assetUrl = function(sourcePath) {
  var url, cname, hash, pathPrefix, assetPath;

  if (sourcePath[0] !== '/') {
    sourcePath = '/' + sourcePath;
  }
  if (config.fingerprint.enabled) {
    sourcePath = fingerprint.getFingerprintedPathSync(publicDir + sourcePath, config.fingerprint.destinationPath, false);
  } else {
    sourcePath += '?_=' + timestamp;
  }

  // Choose the cname based on a hash of the sourcePath, for better caching.
  cname = cdnConfig.cnames[strHash(sourcePath) % cdnConfig.cnames.length];

  pathPrefix = cdnConfig.pathPrefix;
  if (pathPrefix[pathPrefix.length - 1] === '/') {
    pathPrefix = pathPrefix.slice(0, pathPrefix.length - 1);
  }

  url = cdnConfig.protocol + '://' + cname + pathPrefix + sourcePath;
  return url;
};

function strHash(string){
  var hash = 0;
  for (var i = 0, len = string.length; i < len; i++) {
    hash += string.charCodeAt(i);
  }
  return +hash;
}
