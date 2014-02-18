/**
 * This is the app instance that is shared between client and server.
 * The client also subclasses it for client-specific stuff.
 */

var Backbone = require('backbone'),
    _ = require('underscore'),
    Fetcher = require('./fetcher'),
    ModelUtils = require('./modelUtils'),
    isServer = (typeof window === 'undefined'),
    ClientRouter;

if (!isServer) {
  ClientRouter = require('app/router');
  Backbone.$ = window.$ || require('jquery');
}

function noop() {}

var modelOptions = ['url', 'urlRoot', 'collection'];

module.exports = Backbone.Model.extend({

  defaults: {
    loading: false,
    templateAdapter: 'rendr-handlebars'
  },

  /**
   * @shared
   */
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

    this.options = options || {};

    var entryPath = this.options.entryPath || '';
    if (!isServer) {
      // the entry path must always be empty for the client
      entryPath =  '';
    }

    this.modelUtils = this.options.modelUtils || new ModelUtils(entryPath);

    /**
     * On the server-side, you can access the Express request, `req`.
     */
    if (this.options.req) {
      this.req = this.options.req;
    }

    /**
     * Initialize the `templateAdapter`, allowing application developers to use whichever
     * templating system they want.
     */
    this.templateAdapter = require(this.get('templateAdapter'))({entryPath: entryPath});

    /**
     * Instantiate the `Fetcher`, which is used on client and server.
     */
    this.fetcher = new Fetcher({
      app: this
    });

    /**
     * Initialize the `ClientRouter` on the client-side.
     */
    if (!isServer) {
      new ClientRouter({
        app: this,
        entryPath: entryPath,
        appViewClass: this.getAppViewClass(),
        rootPath: attributes.rootPath
      });
    }

    this.initialize.apply(this, arguments);
  },

  /**
   * @shared
   */
  initialize: function(attributes, options) {
    /**
     * Call `postInitialize()`, to make it easy for an application to easily subclass and add custom
     * behavior without having to call i.e. `BaseApp.prototype.initialize.apply(this, arguments)`.
     */
    if (this.postInitialize) {
      console.warn('`postInitialize` is deprecated, please use `initialize`');
      this.postInitialize();
    }
  },

  /**
   * @shared
   */
  fetch: function() {
    this.fetcher.fetch.apply(this.fetcher, arguments);
  },

  /**
   * @client
   */
  getAppViewClass: function () {
    return require('../client/app_view');
  },

  /**
   * @client
   */
  bootstrapData: function(modelMap) {
    this.fetcher.bootstrapData(modelMap);
  },

  /**
   * @client
   */
  start: function() {
    this.router.start();
    this.trigger('start');
  }
});
