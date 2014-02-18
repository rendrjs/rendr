/**
 * This is the app instance that is shared between client and server.
 * The client also subclasses it for client-specific stuff.
 */

var Backbone = require('backbone'),
    Fetcher = require('./fetcher'),
    ModelUtils = require('./modelUtils'),
    isServer = (typeof window === 'undefined'),
    ClientRouter;

if (!isServer) {
  ClientRouter = require('app/router');
  Backbone.$ = window.$ || require('jquery');
}

module.exports = Backbone.Model.extend({

  defaults: {
    loading: false,
    templateAdapter: 'rendr-handlebars'
  },

  /**
   * @shared
   */
  constructor: function(attributes, options) {
    attributes = attributes || {};
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
     *
     * We can't use `this.get('templateAdapter')` here because `Backbone.Model`'s
     * constructor has not yet been called.
     */
    var templateAdapterModule = attributes.templateAdapter || this.defaults.templateAdapter;
    this.templateAdapter = require(templateAdapterModule)({entryPath: entryPath});

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

    Backbone.Model.apply(this, arguments);

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
