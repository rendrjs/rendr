if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['require', '../user_repos_view'], function(require) {

  var BaseView = require('../base');

  var exports = BaseView.extend({
    className: 'users_show_view',

    getTemplateData: function() {
      var data = BaseView.prototype.getTemplateData.call(this);
      data.repos = this.options.repos;
      return data;
    }
  });
  exports.id = 'users/show';

  return exports;

});
