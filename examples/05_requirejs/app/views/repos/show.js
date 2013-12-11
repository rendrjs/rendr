if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var BaseView = require('../base');

  var exports = BaseView.extend({
    className: 'repos_show_view',

    getTemplateData: function() {
      var data = BaseView.prototype.getTemplateData.call(this);
      data.build = this.options.build.toJSON();
      return data;
    }
  });
  exports.id = 'repos/show';

  return exports;

});
