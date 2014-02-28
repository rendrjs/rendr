var _ = require('underscore'),
  chai = require('chai'),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  should = chai.should(),
  proxyquire = require('proxyquire').noCallThru(),
  App = require('../../../shared/app'),
  FakeApp = sinon.stub(),
  initApp = proxyquire('../../../server/middleware/initApp', { 'foo/app/app': App, 'fake/app/app': FakeApp });

chai.use(sinonChai);

describe('initApp', function() {

  afterEach(function () {
    FakeApp.reset();
  });

  it('should throw if no entryPath is given', function () {
    var middleware = initApp();
    middleware.should.throw(Error, 'Cannot find module');
  });

  describe('middleware', function () {
    var middleware, req, res, next;

    beforeEach(function () {
      middleware = initApp(null, { entryPath: 'foo/' });
      req = {};
      res = {};
      next = sinon.spy();
    });

    it('should call next', function () {
      middleware(req, res, next);
      next.should.have.been.calledOnce;
    });

    it('should create a new app instance on the req object', function () {
      middleware(req, res, next);

      req.should.have.property('rendrApp');
      req.rendrApp.should.be.an.instanceof(App);
    });

    describe('appOptions', function () {
      it('should initialize the app with the correct options', function () {
        var options = {
            entryPath: 'fake/',
            modelUtils: {},
            apiPath: 'MyApiPath'
          },
          expectedAppOptions = {
            entryPath: 'fake/',
            modelUtils: {},
            req: req
          };

        middleware = initApp(null, options);
        middleware(req, res, next);

        FakeApp.should.have.been.calledOnce;
        FakeApp.should.have.been.calledWithNew;
        FakeApp.should.have.been.calledWithExactly({ apiPath: 'MyApiPath' }, expectedAppOptions);
      });
    });

    it('should pass through the req object to the app options', function () {
      middleware(req, res, next);

      req.rendrApp.options.should.have.property('req', req);
      req.rendrApp.should.have.property('req', req);
    });

    describe('appAttributes', function () {
      it('can be a function which has access to req and res', function () {
        var appAttributes = sinon.stub().returns({ foo: 'bar' });

        middleware = initApp(appAttributes, { entryPath: 'foo/' });
        middleware(req, res, next);

        appAttributes.should.have.been.calledOnce;
        appAttributes.should.have.been.calledWithExactly(req, res);
        req.rendrApp.get('foo').should.equal('bar');
      });

      it('can be an object', function () {
        var appAttributes = { someAttribute: 'someValue' };

        middleware = initApp(appAttributes, { entryPath: 'foo/' });
        middleware(req, res, next);

        req.rendrApp.get('someAttribute').should.equal('someValue');
      });

      it('should pass through the apiPath to the attributes', function () {
        middleware = initApp(null, { entryPath: 'foo/', apiPath: 'MyApiPath' });
        middleware(req, res, next);

        req.rendrApp.get('apiPath').should.equal('MyApiPath');
      });
    });
  });
});
