var _ = require('underscore'),
    Backbone = require('backbone'),
    BaseView = require('../shared/base/view'),
    $ = (typeof window !== 'undefined' && window.$) || require('jquery');

Backbone.$ = $;

module.exports = BaseView.extend({
  el: 'body',

  constructor: function() {
    BaseView.apply(this, arguments);

    _.defaults(this.options, {
      contentEl: '#content'
    });

    /**
     * Grab the element that contains the main view.
     */
    this.$content = $(this.options.contentEl);
    this._bindInterceptClick();
  },

  hasPushState: typeof window !== "undefined" && window.history.pushState != null,

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
    if (this.shouldInterceptClick(href, e.currentTarget, e)) {
      e.preventDefault();
      this.app.router.redirectTo(href);
    }
  },

  shouldInterceptClick: function(href, el, e) {
    var hashParts, isHashClick;

    if (!(href && this.hasPushState) || e.metaKey || e.shiftKey) {
      return false;
    }

    hashParts = href.split('#');
    isHashClick = hashParts.length > 1 && hashParts[0] === window.location.pathname;
    return !isHashClick && href.slice(0, 1) === '/' && href.slice(0, 2) !== '//';
  }

});
