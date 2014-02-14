var BaseAppView = require('rendr/client/app_view')
  , $ = require('jquery')
  , $body = $('body')
  , _ = require('underscore');
;

module.exports = AppView;
function AppView() {
  BaseAppView.apply(this, arguments);
}

_.extend(AppView.prototype, BaseAppView.prototype, {
  postInitialize: function() {
    this.app.on('change:loading', function(app, loading) {
      $body.toggleClass('loading', loading);
    });

    this.app.on('change:title', function(app, title) {
      document.title = title + ' | Rendr Example App';
    });
  }
});
