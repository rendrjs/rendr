/*global rendr*/
/*
* This is the app instance that is shared between client and server.
* The client also subclasses it for client-specific stuff.
*/
var Backbone, ClientRouter, Fetcher,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

require('./globals');
Backbone = require('backbone');
Fetcher = require('./fetcher');

if (!global.isServer) {
  ClientRouter = require(rendr.entryPath + "/app/router");
}

function noop() {}

module.exports = (function(_super) {
  __extends(App, _super);

  function App() {
    App.__super__.constructor.apply(this, arguments);
  }

  App.prototype.defaults = {
    loading: false
  };

  /*
  * @shared
  */
  App.prototype.initialize = function() {
    this.fetcher = new Fetcher({
      app: this
    });
    if (!global.isServer) {
      new ClientRouter({
        app: this
      });
    }
    this.postInitialize();
  };

  App.prototype.postInitialize = noop;

  /*
  * @shared
  */
  App.prototype.fetch = function() {
    this.fetcher.fetch.apply(this.fetcher, arguments);
  };

  /*
  * @client
  */
  App.prototype.bootstrapData = function(modelMap) {
    this.fetcher.bootstrapData(modelMap);
  };

  /*
  * @client
  */
  App.prototype.start = function() {
    this.router.start();
  };

  return App;

})(Backbone.Model);
