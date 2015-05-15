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

module.exports = Backbone.Model.extend({

  defaults: {
    loading: false,
    templateEngine: 'handlebars',
    templateAdapter: 'rendr-handlebars'
  },

  // Set keys to undefined so runtime V8 is happier
  templateAdapter: undefined,
  req: undefined,
  modelUtils: undefined,
  fetcher: undefined,

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

    this.initializeTemplateAdapter(entryPath, attributes);

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
      if (this.options.ClientRouter) {
        ClientRouter = this.options.ClientRouter;
      }

      new ClientRouter({
        app: this,
        entryPath: entryPath,
        appViewClass: this.getAppViewClass(),
        rootPath: attributes.rootPath
      });
    }

    Backbone.Model.apply(this, arguments);
  },

  /**
   * @shared
   *
   * Initialize the `templateAdapter`, allowing application developers to use whichever
   * templating system they want.
   *
   * We can't use `this.get('templateAdapter')` here because `Backbone.Model`'s
   * constructor has not yet been called.
   */
  initializeTemplateAdapter: function(entryPath, attributes) {
    if (this.options.templateAdapterInstance) {
      this.templateAdapter = this.options.templateAdapterInstance;
    } else {
      var templateAdapterModule = attributes.templateAdapter || this.defaults.templateAdapter,
        templateAdapterOptions = {entryPath: entryPath},
        templateEngine = require(attributes.templateEngine || this.defaults.templateEngine);

      templateAdapterOptions = this.setTemplateFinder(templateAdapterOptions);
      this.templateAdapter = require(templateAdapterModule)(templateAdapterOptions, templateEngine);
    }
  },

  /**
   * @shared
   * Override this in app/app to return a custom template finder
   */
  getTemplateFinder: _.noop,

  /**
   * @shared
   */
  setTemplateFinder: function(templateAdapterOptions) {
    if (_.isFunction(this.getTemplateFinder) && this.getTemplateFinder !== _.noop) {
      templateAdapterOptions.templateFinder = this.getTemplateFinder();
    }
    return templateAdapterOptions;
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
  bootstrapData: function(modelMap, callback) {
    this.fetcher.bootstrapData(modelMap, callback);
  },

  /**
   * @client
   */
  start: function() {
    this.router.start();
    this.trigger('start');
  }
});
