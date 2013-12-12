if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var BaseView = require('./base');

  var exports = BaseView.extend({
    className: 'user_repos_view'
  });
  exports.id = 'user_repos_view';

  return exports;

});
