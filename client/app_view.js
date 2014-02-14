var _ = require('underscore'),
    $ = (typeof window !== 'undefined' && window.$) || require('jquery');

function AppView(options) {

  this.options = options || {};

  _.defaults(this.options, {
    el: 'body',
    contentEl: '#content'
  });

  if( options.app != null ) {
    this.app = this.options.app;
  }
  else {
    throw new Error('options.app expected when creating a new AppView');
  }

  this.postInitialize();

  this.$content = $(this.options.contentEl);
  this.$el = $(this.options.el);
  this._bindInterceptClick();
}

_.extend(AppView.prototype, {
  postInitialize: function noop() {},

  hasPushState: typeof window !== "undefined" && window.history.pushState != null,

  render: function() {},

  setCurrentView: function(view) {
    view.renderInside(this.$content);
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

module.exports = AppView;
