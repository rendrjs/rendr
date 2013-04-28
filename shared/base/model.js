var _, Backbone, Base, syncer,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('underscore');
Backbone = require('backbone');
syncer = require('../syncer');

module.exports = Base = (function(_super) {
  __extends(Base, _super);

  function Base(models, options) {
    // Capture the options as instance variable.
    this.options = options || {};

    // Store a reference to the app instance.
    this.app = this.options.app;
    Base.__super__.constructor.apply(this, arguments);
    if (!this.app && this.collection) {
      this.app = this.collection.app;
    }

    this.store = _.bind(this.store, this);
    this.on('change', this.store);
  }

  /*
  * Idempotent parse
  */
  Base.prototype.parse = function(resp) {
    if (this.jsonKey) {
      return resp[this.jsonKey] || resp;
    } else {
      return resp;
    }
  };

  Base.prototype.checkFresh = syncer.checkFresh;

  Base.prototype.sync = syncer.getSync();

  Base.prototype.getUrl = syncer.getUrl;

  /*
  * Instance method to store in the modelStore.
  */
  Base.prototype.store = function() {
    this.app.fetcher.modelStore.set(this);
  };

  return Base;

})(Backbone.Model);
