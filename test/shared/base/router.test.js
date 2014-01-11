var BaseRouter = require('../../../shared/base/router'),
  sinon = require('sinon'),
  chai = require('chai'),
  should = chai.should();

chai.use(require('sinon-chai'));

describe('BaseRouter', function () {
  describe('initialization', function () {
    var testCases = [
        {
          options: { entryPath: 'foobar/' },
          expectedOptions: {
            entryPath: 'foobar/',
            paths: {
              entryPath: 'foobar/',
              routes: 'foobar/app/routes',
              controllerDir: 'foobar/app/controllers'
            }
          }
        },
        {
          options: {
            paths: {
              entryPath: 'foobar/',
              routes: '/some/other/location/MyRoutes.js',
              controllerDir: 'another/different/location/'
            }
          },
          expectedOptions: {
            paths: {
              entryPath: 'foobar/',
              routes: '/some/other/location/MyRoutes.js',
              controllerDir: 'another/different/location/'
            }
          }
        },
        {
          options: { entryPath: 'foobar/' },
          expectedOptions: {
            entryPath: 'foobar/',
            paths: {
              entryPath: 'foobar/',
              routes: 'foobar/app/routes',
              controllerDir: 'foobar/app/controllers'
            }
          }
        },
        {
          options: { entryPath: '' },
          expectedOptions: {
            entryPath: '',
            paths: {
              entryPath: '',
              routes: 'app/routes',
              controllerDir: 'app/controllers'
            }
          }
        }
      ];

    testCases.forEach(function(testCase) {
      it('should initialize the paths options', function() {
        var router = new BaseRouter(testCase.options);
        router.options.should.be.deep.equal(testCase.expectedOptions);
      });
    });

  });

  describe('router instance', function() {
    var router;

    beforeEach(function() {
      router = new BaseRouter({entryPath: 'MyAppRootPath/'});
    });

    describe('getAction', function () {
      it('should return the controller path in AMD environment', function () {
        var action;

        BaseRouter.setAMDEnvironment(true);
        action = router.getAction({controller: 'home'});

        action.should.be.equal('MyAppRootPath/app/controllers/home_controller')
        BaseRouter.setAMDEnvironment(false);
      });

      it('should load the controller in non AMD environments', function () {
        var action,
          controller = { index: sinon.spy() },
          loadController = sinon.stub(router, 'loadController').returns(controller);

        action = router.getAction({controller: 'home', action: 'index'});

        loadController.should.have.been.calledOnce;
        loadController.should.have.been.calledWith('home');
        action.should.be.equal(controller.index);
      });
    });

    describe('getRedirect', function() {
      it('should return undefined if no redirect is given', function() {
        var redirect = router.getRedirect({});
        should.not.exist(redirect);
      });

      it('should return a string if the redirect is given as a string', function() {
        var route = {redirect: '/home'},
          redirect = router.getRedirect(route);

        redirect.should.be.equal('/home');
      });

      it('should return the result of a given function', function() {
        var params = {foo: 'bar'},
          route = {redirect: function(params) {
            return params.foo;
          }},
          redirect = router.getRedirect(route, params);

        redirect.should.be.equal('bar');
      });
    });

    describe('buildRoutes', function() {
      it('should add route definitions', function () {
        var getRouteBuilder = sinon.stub(router, 'getRouteBuilder'),
          route = sinon.stub(router, 'route');

        getRouteBuilder.returns(function (match) {
          match('/foobar', 'foobar#index');
        });
        router.buildRoutes();

        route.should.have.been.calledOnce;
        route.should.have.been.calledWithExactly('/foobar', 'foobar#index');
      });
    });

    describe('route', function() {
      var action, handler, getAction, getHandler;

      beforeEach(function() {
        action = sinon.spy();
        handler = sinon.spy();
        getAction = sinon.stub(router, 'getAction').returns(action);
        getHandler = sinon.stub(router, 'getHandler').returns(handler);
      });

      it('should trigger an event and pass the correct route object', function() {
        var trigger = sinon.stub(router, 'trigger');

        router.route('/home', 'home#index');

        trigger.should.have.been.calledOnce;
        trigger.should.have.been.calledWithExactly('route:add', [
          '/home',
          { controller: 'home', action: 'index' },
          handler
        ]);
      });
    });
  });
});
