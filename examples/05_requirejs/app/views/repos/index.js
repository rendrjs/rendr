if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var BaseView = require('../base');

  var exports = BaseView.extend({
    className: 'repos_index_view'
  });
  exports.id = 'repos/index';

  return exports;

});
