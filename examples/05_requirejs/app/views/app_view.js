if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {
  var BaseAppView = require('rendr/client/app_view');

  var $body = $('body');

  return BaseAppView.extend({
    postInitialize: function() {
      this.app.on('change:loading', function(app, loading) {
        $body.toggleClass('loading', loading);
      }, this);
    }
  });

});
