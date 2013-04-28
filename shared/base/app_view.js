var AppView, BaseView, hasPushState, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('underscore');
BaseView = require('./view');

hasPushState = typeof window !== "undefined" && window.history.pushState != null;

module.exports = AppView = (function(_super) {
  __extends(AppView, _super);

  function AppView() {
    this._interceptClick = _.bind(this._interceptClick, this);
    AppView.__super__.constructor.apply(this, arguments);
  }

  AppView.prototype.el = 'body';

  AppView.prototype.initialize = function() {
    AppView.__super__.initialize.apply(this, arguments);
    this.app = this.options.app;
    _.defaults(this.options, {
      contentEl: '#content'
    });

    /*
    * Grab the element that contains the main view.
    */
    this.$content = $(this.options.contentEl);
    this._bindInterceptClick();
  };

  AppView.prototype.render = function() {};

  AppView.prototype.setCurrentView = function(view) {
    this.$content.html(view.el);
    view.render();
  };

  AppView.prototype._bindInterceptClick = function() {
    this.$el.on('click', 'a:not([data-pass-thru])', this._interceptClick);
  };

  AppView.prototype._interceptClick = function(e) {
    /*
    * We want the actual value of the attribute, rather than the
    * full URL, so we use jQuery instead of just e.currentTarget.href
    */
    var href;

    href = $(e.currentTarget).attr('href');
    if (this.shouldInterceptClick(href, e.currentTarget)) {
      e.preventDefault();
      this.app.router.redirectTo(href);
    }
  };

  AppView.prototype.shouldInterceptClick = function(href, el) {
    var hashParts, isHashClick;

    if (!(href && hasPushState)) {
      return false;
    }
    hashParts = href.split('#');
    isHashClick = hashParts.length > 1 && hashParts[0] === window.location.pathname;
    return !isHashClick && href.slice(0, 1) === '/' && href.slice(0, 2) !== '//';
  };

  return AppView;

})(BaseView);
