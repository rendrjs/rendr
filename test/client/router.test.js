var should = require('chai').should(),
    App = require('../../shared/app'),
    BaseView = require('../../shared/base/view'),
    AppView = require('../../client/app_view'),
    Router = require('../../client/router'),
    clientTestHelper = require('../helpers/client_test'),
    AppViewClass = require('../../client/app_view');

var routerConfig = {
  app: new App({}, {}),
  appViewClass: AppViewClass,
  paths: {
    entryPath: __dirname + "/../fixtures/"
  },
  appViewClass: AppView,
};

describe("client/router", function() {

  before(clientTestHelper.before);
  after(clientTestHelper.after);

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
