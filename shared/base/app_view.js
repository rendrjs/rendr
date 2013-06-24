var BaseView, hasPushState, _;

_ = require('underscore');
BaseView = require('./view');

hasPushState = typeof window !== "undefined" && window.history.pushState != null;

module.exports = BaseView.extend({
  el: 'body',

  initialize: function() {
    BaseView.prototype.initialize.apply(this, arguments);

    _.defaults(this.options, {
      contentEl: '#content'
    });

    /**
     * Grab the element that contains the main view.
     */
    this.$content = $(this.options.contentEl);
    this._bindInterceptClick();
  },

  render: function() {},

  setCurrentView: function(view) {
    this.$content.html(view.el);
    view.render();
  },

  _bindInterceptClick: function() {
    this.$el.on('click', 'a:not([data-pass-thru])', this._interceptClick.bind(this));
  },

  _interceptClick: function(e) {
    /**
     * We want the actual value of the attribute, rather than the
     * full URL, so we use jQuery instead of just e.currentTarget.href
     */
    var href = $(e.currentTarget).attr('href');
    if (this.shouldInterceptClick(href, e.currentTarget)) {
      e.preventDefault();
      this.app.router.redirectTo(href);
    }
  },

  shouldInterceptClick: function(href, el) {
    var hashParts, isHashClick;

    if (!(href && hasPushState)) {
      return false;
    }
    hashParts = href.split('#');
    isHashClick = hashParts.length > 1 && hashParts[0] === window.location.pathname;
    return !isHashClick && href.slice(0, 1) === '/' && href.slice(0, 2) !== '//';
  }

});
