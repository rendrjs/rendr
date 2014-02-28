var chai = require('chai'),
    should = chai.should(),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    Server = require('../../server/server');

chai.use(sinonChai);

describe('server/server', function() {
  var server;

  beforeEach(function () {
    server = new Server();
  });

  it('should warn if deprecated global rendr object is used', sinon.test(function () {
    var warn = this.stub(console, 'warn');

    global.rendr = { entryPath: 'foo' };
    server = new Server();

    warn.should.have.been.calledOnce;
    warn.should.have.been.calledWithExactly('Setting rendr.entryPath is now deprecated. Please pass in \nentryPath when initializing the rendr server.');
  }));

  describe('configure', function () {
    var use, req, res, next, initApp;

    beforeEach(function () {
      use = sinon.stub(server.expressApp, 'use');
      req = { path: '/', headers: {}, body: {} };
      res = { end: sinon.stub() };
      next = sinon.spy();
      use.yields(req, res, next);
      initApp = sinon.spy();
      sinon.stub(server, 'initApp').returns(initApp);
      sinon.stub(server, 'buildRoutes');
      sinon.stub(server, 'errorHandler');
    });

    describe('lazy configuration', function () {
      var handle, configure;

      beforeEach(function () {
        handle = sinon.stub(server.expressApp, 'handle');
        configure = sinon.spy(server, 'configure');
      });

      it('should automatically configure if the server is not configured manually', function () {
        server.handle();

        handle.should.have.been.calledOnce;
        configure.should.have.been.calledOnce;
      });

      it('should not configure the server if it is already configured', function () {
        server.configure();
        server.handle();

        handle.should.have.been.calledOnce;
        configure.should.not.have.been.calledTwice;
      });

    });

    it('should attach the dataAdapter to the `req` object', function () {
      server.configure();

      req.dataAdapter.should.equal(server.dataAdapter);
      next.should.have.been.called;

      res.end();
      should.not.exist(req.dataAdapter);
    });

    it('should mount the initApp middleware with correct options', function () {
      var expectedOptions = {
        apiPath: server.options.apiPath,
        entryPath: server.options.entryPath,
        modelUtils: server.options.modelUtils
      };

      server.configure();

      initApp.should.have.been.calledOnce;
      server.initApp.should.have.been.calledOnce;
      server.initApp.should.have.been.calledWithExactly({}, expectedOptions);
    });

    it('should call custom configure function if one is given', function () {
      var customConfigureFunction = sinon.spy();

      server.configure(customConfigureFunction);

      customConfigureFunction.should.have.been.calledOnce;
      customConfigureFunction.should.have.been.calledWithExactly(server.expressApp);
    });

    it('should mount the apiProxy to the apiPath', function () {
      var apiProxy = sinon.stub(),
        proxyMiddleware = sinon.spy();

      server.options.apiProxy = apiProxy;
      apiProxy.returns(proxyMiddleware);
      server.configure();

      apiProxy.should.have.been.calledOnce;
      use.should.have.been.calledWithExactly(server.options.apiPath, proxyMiddleware);
    });

    it('should mount the configured errorHandler', function () {
      server.configure();
      use.should.have.been.calledWithExactly(server.errorHandler);
    });

    it('should be able to mount the 404 error handler to non api routes', function () {
      var notFoundHandler = sinon.stub(),
        expressGet = sinon.stub(server.expressApp, 'get');

      server.options.notFoundHandler = notFoundHandler;
      server.configure();

      expressGet.should.have.been.calledWithExactly(/^(?!\/api\/)/, notFoundHandler);
    });
  });

  describe('buildRoutes', function () {
    it('should bind routes to the express app', function () {
      var routerBuildRoutes = sinon.stub(server.router, 'buildRoutes'),
        routePattern = '/foo/:id',
        routeHandler = sinon.spy(),
        routes = [ [ routePattern, { }, routeHandler ] ],
        expressGet = sinon.stub(server.expressApp, 'get');

      routerBuildRoutes.returns(routes);
      server.buildRoutes();

      expressGet.should.have.been.calledOnce;
      expressGet.should.have.been.calledWithExactly(routePattern, routeHandler);
    });
  });

  describe('express render Engine', function(){
    it('should have a default', function() {
      server.expressApp.get('view engine').should.equal('js')
    });
    it('should be able to be changed', function() {
      server = new Server({defaultEngine: 'other render engine'});
      server.expressApp.get('view engine').should.equal('other render engine')
    });
  });

});
