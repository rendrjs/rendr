if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {
  var Base = require('./base');

  var exports = Base.extend({
    url: '/users/:login',
    idAttribute: 'login'
  });
  exports.id = 'User';

  return exports;
});
