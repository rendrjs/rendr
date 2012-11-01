var stylus = require('stylus');
var cdn = require('./cdn');

exports.assetUrl = function (basePath) {
  if (basePath) {
    basePath = basePath + '/';
  } else {
    basePath = '';
  }
  return function(args) {
    var url = cdn.assetUrl(basePath+args.val);
    return new stylus.nodes.Literal('url('+url+')');
  }
}
