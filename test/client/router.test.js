var should = require('chai').should(),
    App = require('../../shared/app'),
    sinon = require('sinon'),
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

  describe('Redirecting', function(){
    it("should send a full url out of the app", function(done) {
      var url = 'http://www.example.com';
      var stub = sinon.stub(this.router, 'exitApp');
      this.router.navigate(url);
      expect(stub.called).to.equal(true);
      done();
    });
    it("should send an unmatched route out of the app", function(done) {
      var path = '/no/route/match';
      var stub = sinon.stub(this.router, 'exitApp');
      this.router.navigate(path);
      expect(stub.called).to.equal(true);
      done();
    });
    it("should not modify full urls", function(done) {
      var paths = [
        'mailto:foo@example.com', 
        'tel:415-215-1234',
        'http://www.foo.com',
        'https://foo.com',
        'HTTP://bar.com',
        'TEL:415-215-1234',
        'MAILTO:bar@example.com',
        '//foo.com'
      ];
      var self = this;
      paths.forEach(function(path){
        expect(self.router.noRelativePath(path)).to.equal(path);
      });
      done();
    });
    it("paths should all be prefixed with a /", function(done) {
      var paths = ['/a/root', 'a/rel/', 'a//rel/', '/a//root/'];
      var self = this;
      paths.forEach(function(path){
        expect(self.router.noRelativePath(path).charAt(0)).to.equal('/');
      });
      done();
    });
  });
});
