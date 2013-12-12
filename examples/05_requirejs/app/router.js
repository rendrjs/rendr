if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var BaseClientRouter = require('rendr/client/router');

  var Router = function Router(options) {
    BaseClientRouter.call(this, options);
  };

  /**
   * Set up inheritance.
   */
  Router.prototype = Object.create(BaseClientRouter.prototype);
  Router.prototype.constructor = BaseClientRouter;

  Router.prototype.postInitialize = function() {
    this.on('action:start', this.trackImpression, this);
  };

  Router.prototype.trackImpression = function() {
    if (window._gaq) {
      _gaq.push(['_trackPageview']);
    }
  };

  return Router;

});
