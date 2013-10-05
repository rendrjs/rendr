var BaseAppView = require('rendr/shared/base/app_view');

var $body = $('body');

module.exports = BaseAppView.extend({
  postInitialize: function() {
    this.app.on('change:loading', function(app, loading) {
      $body.toggleClass('loading', loading);
    }, this);
  }
});
