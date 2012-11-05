var md5 = require('MD5'),
    fs = require('fs'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    walk = require('walk'),
    path = require('path');

var getDigest = module.exports.getDigest = function(sourcePath, callback){
  sourcePath = path.normalize(sourcePath);
  fs.readFile(sourcePath, function(err, buffer){
    if (err) return callback(err);
    callback(null, bufferToMd5(buffer));
  });
};

var getDigestSync = module.exports.getDigestSync = function(sourcePath){
  sourcePath = path.normalize(sourcePath);
  return bufferToMd5(fs.readFileSync(sourcePath));
};

var getDigests = module.exports.getDigests = function(paths, callback){
  async.map(paths, this.getDigest, callback);
};

// This copies over a nested directory of assets to a new location, but with the
// fingerprinted filenames.
// Source is the directory that holds a tree of asset files to be fingerprinted.
// Destination is the output directory of the fingerprinted assets.
module.exports.fingerprintAssets = function(sourceDir, destinationDir, callback){
  mkdirp(destinationDir, function(err){
    if (err) return callback(err);
      var walker = walk.walk(path.normalize(sourceDir)),
        assets = [];

    walker.on('file', function(root, stat, localNext){
      if (stat.name[0] !== '.') {
        var sourcePath = root + '/' + stat.name;
        assets.push(sourcePath);
      }
      localNext();
    });

    walker.on('end', function(){
      async.forEach(assets, function(asset, next){
        createFingerprint(asset, destinationDir, next);
      }, callback);
    });
  });
};

var getFingerprintedPath = module.exports.getFingerprintedPath = function(sourcePath, destinationDir, absolute, callback){
  sourcePath = sourcePath.replace('?', '');
  getDigest(sourcePath, function(err, digest){
    var fingerprintedPath = addFingerprintToPath(sourcePath, destinationDir, digest, absolute);
    callback(err, fingerprintedPath);
  });
};

module.exports.getFingerprintedPathSync = function(sourcePath, destinationDir, absolute){
  sourcePath = sourcePath.replace('?', '');
  var digest = getDigestSync(sourcePath);
  return addFingerprintToPath(sourcePath, destinationDir, digest, absolute);
};

function addFingerprintToPath(sourcePath, destinationDir, digest, absolute){
  // By default, return absolute path to asset.
  // Relative path is useful for i.e. CDN urls.
  if (absolute == null) absolute = true;

  sourcePath = path.normalize(sourcePath);
  destinationDir = path.normalize(destinationDir);

  var shared, destinationPath;
  shared = getSharedPath(sourcePath, destinationDir);

  if (absolute) {
    destinationPath = shared + destinationDir.replace(shared, '') + sourcePath.replace(shared, '');
  } else {
    destinationPath = sourcePath.replace(shared, '');
  }

  var parts, ext;
  parts = destinationPath.split('.');
  ext = parts.splice(-1, 1);
  return parts.join('.') + '-' + digest + '.' + ext;
}

function createFingerprint(sourcePath, destinationDir, callback){
  getFingerprintedPath(sourcePath, destinationDir, true, function(err, fingerprintedPath){
    mkdirp(basepath(fingerprintedPath), '0777', function(err){
      copy(sourcePath, fingerprintedPath, callback);
    });
  });
}

function copy(source, destination, callback) {
  var oldFile = fs.createReadStream(source);
  var newFile = fs.createWriteStream(destination, {flags: 'w', mode: '0777'});
  oldFile.pipe(newFile);
  oldFile.on('end', function(){
    callback(null);
  });
}

// Returns the part of the path that's shared between two paths.
// TODO faster way to do this?
// We cache it for speed, but this means that you can only ever
// have one source and one destination directory.
var _sharedPathCached;
function getSharedPath(path1, path2){
  if (_sharedPathCached != null) return _sharedPathCached;
  var i = 0,
      parts1 = path1.split('/'),
      parts2 = path2.split('/');
  while (parts1[i] === parts2[i]) {
    i++;
  }
  _sharedPathCached = parts1.slice(0, i).join('/');
  return _sharedPathCached;
}

function basepath(path){
  var parts = path.split('/');
  return parts.slice(0, parts.length - 1).join('/');
}

function bufferToMd5(buffer){
  return md5(buffer.toString('base64'));
}
