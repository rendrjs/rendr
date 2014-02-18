var _ = require('underscore'),
    Backbone = require('backbone'),
    syncer = require('../syncer'),
    isServer = (typeof window === 'undefined');

if (!isServer) {
  Backbone.$ = window.$ || require('jquery');
}

var modelOptions = ['url', 'urlRoot', 'collection'];

var BaseModel = Backbone.Model.extend({

  constructor: function(attributes, options) {
    /**
     * Copied over from the Backbone.Model constructor
     */
    var defaults;
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    _.extend(this, _.pick(options, modelOptions));
    if (options.parse) attrs = this.parse(attrs, options) || {};
    if (defaults = _.result(this, 'defaults')) {
      attrs = _.defaults({}, attrs, defaults);
    }
    this.set(attrs, options);
    this.changed = {};

    // Capture the options as instance variable.
    this.options = options || {};

    // Store a reference to the app instance.
    this.app = this.options.app;

    if (!this.app && this.collection) {
      this.app = this.collection.app;
    }

    this.on('change', this.store, this);

    this.initialize.apply(this, arguments);
  },

  /**
   * Idempotent parse
   */
  parse: function(resp) {
    if (resp != null && this.jsonKey) {
      return resp[this.jsonKey] || resp;
    } else {
      return resp;
    }
  },

  /**
   * Instance method to store in the modelStore.
   */
  store: function() {
    this.app.fetcher.modelStore.set(this);
  }
});

/**
 * Mix-in the `syncer`, shared between `BaseModel` and `BaseCollection`, which
 * encapsulates logic for fetching data from the API.
 */
_.extend(BaseModel.prototype, syncer);

module.exports = BaseModel;
