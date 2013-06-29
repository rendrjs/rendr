require('../shared/globals');

var _ = require('underscore')
  , Router = require('./router')
  , ViewEngine = require('./viewEngine');

module.exports = Server;

function Server(expressApp, options) {
  this.options = options || {};
  _.defaults(this.options, this.defaultOptions);

  this.initialize();
}

Server.prototype.defaultOptions = {
  dataAdapter: null,
  viewEngine: null,
  router: null,
  errorHandler: null,
  stashError: null,
  paths: {}
};

Server.prototype.initialize = function() {
  // verify dataAdapter
  if (!this.options.dataAdapter) {
    throw new Error("Missing dataAdapter");
  }

  this.dataAdapter = this.options.dataAdapter;

  this.viewEngine = this.options.viewEngine || new ViewEngine();

  this.router = new Router(this.options);
};
