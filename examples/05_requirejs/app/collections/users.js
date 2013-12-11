if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var User = require('../models/user')
    , Base = require('./base');

  var exports = Base.extend({
    model: User,
    url: '/users'
  });
  exports.id = 'Users';

  return exports;

});
