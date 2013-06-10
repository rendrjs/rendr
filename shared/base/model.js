var _, Backbone, syncer, Super;

_ = require('underscore');
Backbone = require('backbone');
syncer = require('../syncer');

Super = Backbone.Model;

module.exports = Super.extend({

  initialize: function(models, options) {
    // Capture the options as instance variable.
    this.options = options || {};

    // Store a reference to the app instance.
    this.app = this.options.app;

    if (!this.app && this.collection) {
      this.app = this.collection.app;
    }

    this.on('change', this.store, this);

    Super.prototype.initialize.apply(this, arguments);
  },

  /**
   * Idempotent parse
   */
  parse: function(resp) {
    if (this.jsonKey) {
      return resp[this.jsonKey] || resp;
    } else {
      return resp;
    }
  },

  checkFresh: syncer.checkFresh,

  sync: syncer.getSync(),

  getUrl: syncer.getUrl,

  /**
   * Instance method to store in the modelStore.
   */
  store: function() {
    this.app.fetcher.modelStore.set(this);
  }
});
