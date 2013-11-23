/*global rendr*/

/**
 * This is the app instance that is shared between client and server.
 * The client also subclasses it for client-specific stuff.
 */

var Backbone, ClientRouter, Fetcher, clientEntryPath, ModelUtils;

require('./globals');
Backbone = require('backbone');
Fetcher = require('./fetcher');
ModelUtils = require('./modelUtils')

clientEntryPath = '';

if (!global.isServer) {
  // client side only, entryPath is always empty
  ClientRouter = require('app/router');
}

function noop() {}

module.exports = Backbone.Model.extend({

  defaults: {
    loading: false,
    templateAdapter: 'rendr-handlebars'
  },

  /**
   * @shared
   */
  initialize: function(attributes, options) {
    this.options = options || {};

    entryPath = this.options.entryPath || clientEntryPath
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
    if (!global.isServer) {
      new ClientRouter({
        app: this,
        entryPath: clientEntryPath
      });
    }

    /**
     * Call `postInitialize()`, to make it easy for an application to easily subclass and add custom
     * behavior without having to call i.e. `BaseApp.prototype.initialize.apply(this, arguments)`.
     */
    this.postInitialize();
  },

  postInitialize: noop,

  /**
   * @shared
   */
  fetch: function() {
    this.fetcher.fetch.apply(this.fetcher, arguments);
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
