var BaseClientRouter = require('rendr/client/router');

var Router = module.exports = function Router(options) {
  BaseClientRouter.call(this, options);
};

Router.prototype.__proto__ = BaseClientRouter.prototype;

Router.prototype.postInitialize = function() {
  this.on('action:start', this.trackImpression, this);
};

Router.prototype.trackImpression = function() {
  if (window._gaq) {
    _gaq.push(['_trackPageview']);
  }
};
