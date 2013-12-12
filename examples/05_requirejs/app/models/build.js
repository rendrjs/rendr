if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {
  var Base = require('./base');

  var exports = Base.extend({
    url: '/repos/:owner/:name',
    api: 'travis-ci'
  });
  exports.id = 'Build';

  return exports;
});
