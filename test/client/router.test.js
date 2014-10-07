var should = require('chai').should(),
    App = require('../../shared/app'),
    clientTestHelper = require('../helpers/client_test');

describe("client/router", function() {
  var routerConfig,
      BaseView,
      Router,
      AppViewClass;

  before(function () {
    clientTestHelper.before.call(this);

    AppViewClass = require('../../client/app_view');
    routerConfig = {
      app: new App({}, {}),
      appViewClass: AppViewClass,
      paths: {
        entryPath: __dirname + "/../fixtures/"
      }
    };
  });

  after(clientTestHelper.after);

  beforeEach(function() {
    BaseView = require('../../shared/base/view');
    Router = require('../../client/router');
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
