if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var BaseView = require('../base');

  var exports = BaseView.extend({
    className: 'users_index_view'
  });
  exports.id = 'users/index';

  return exports;

});
