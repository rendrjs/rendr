var App, Backbone, BaseView, Router, should, sinon, routerConfig;

Backbone = require('backbone');
should = require('should');
sinon = require('sinon');

App = require('../../shared/app');
BaseView = require('../../shared/base/view');
Router = require('../../client/router');

// This should go in a global setup.
// it sets a global $ variable, which is accessed in AppView;
Backbone.$ = global.$ = require('jquery').create();

routerConfig = {
  app: new App,
  paths: {
    entryPath: __dirname + "/../fixtures"
  }
};

describe("client/router", function() {

  // Since this is simulating the client, we need to find the elements in the jsdom
  before(function(){
    this.originalEnsure = BaseView.prototype._ensureElement;
    this.originalDelegate = BaseView.prototype.delegateEvents;
    BaseView.prototype._ensureElement = Backbone.View.prototype._ensureElement;
    BaseView.prototype.delegateEvents = Backbone.View.prototype.delegateEvents;
  });

  after(function(){
    BaseView.prototype._ensureElement = this.originalEnsure;
    BaseView.prototype.delegateEvents = this.originalDelegate;
  });

  beforeEach(function() {
    this.router = new Router(routerConfig);
  });

  describe('getRenderCallback', function(){
    it("should trigger a router:error on the application", function(done) {
      this.router.on("action:error", function(err, route){
        err.should.have.property('status', 401);
        route.should.equal("myRoute")
        done();
      });

      var routeCallback = this.router.getRenderCallback("myRoute");
      routeCallback({status: 401}, null, null);
    });
  });

});
