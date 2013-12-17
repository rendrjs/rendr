var _ = require('underscore'),
    sinon = require('sinon'),
    apiProxy = require('./../../../server/middleware/apiProxy'),
    should = require('chai').should();

describe('apiProxy', function() {

  describe('middleware', function () {

    var dataAdapter, proxy, responseToClient, req;

    beforeEach(function () {
      dataAdapter = { request: sinon.stub() };
      proxy = apiProxy(dataAdapter);
      responseToClient = { status: sinon.spy(), json: sinon.spy(), setHeader: sinon.spy() };
      req = { path: '/', get: sinon.stub() };
    });

    it('should pass through the status code', function () {
      dataAdapter.request.yields(null, {status: 200, headers: {}}, {});

      proxy(req, responseToClient);

      responseToClient.status.should.have.been.calledOnce;
    });

    it('should pass through the body', function () {
      var body = { what: 'ever' };
      dataAdapter.request.yields(null, {status: 200, headers: {}}, body);

      proxy(req, responseToClient);

      responseToClient.json.should.have.been.calledOnce;
      responseToClient.json.should.have.been.calledWith(body);
    });

    describe('cookie forwarding', function () {
      it('should pass through prefixed cookies for the default api', function () {
        var cookiesReturnedByApi = [
            'FooBar=SomeCookieData; path=/',
            'BarFoo=OtherCookieData; path=/'
          ];

        dataAdapter.request.yields(null, { headers: { 'set-cookie': cookiesReturnedByApi } });
        proxy(req, responseToClient);

        responseToClient.setHeader.should.have.been.calledOnce;
        responseToClient.setHeader.should.have.been.calledWith('set-cookie', ['default/-/FooBar=SomeCookieData; path=/', 'default/-/BarFoo=OtherCookieData; path=/'])
      });

      it('should pass through prefixed cookies', function () {
        var cookiesReturnedByApi = [ 'FooBar=SomeCookieData; path=/' ];

        dataAdapter.request.yields(null, { headers: { 'set-cookie': cookiesReturnedByApi } });
        req.path = '/apiName/-/';
        proxy(req, responseToClient);

        responseToClient.setHeader.should.have.been.calledOnce;
        responseToClient.setHeader.should.have.been.calledWith('set-cookie', ['apiName/-/FooBar=SomeCookieData; path=/'])
      });

      it('should pass through the cookies from client to the correct api host', function () {
        req.path = '/apiName/-/';
        req.get.withArgs('cookie').returns('apiName/-/FooBar=SomeCookieData; otherApi/-/BarFoo=OtherCookieData');
        proxy(req, responseToClient);

        dataAdapter.request.should.have.been.calledWithMatch(req, {headers: {cookie: ['FooBar=SomeCookieData']}});

        req.path = '/otherApi/-/';
        proxy(req, responseToClient);

        dataAdapter.request.should.have.been.calledWithMatch(req, {headers: {cookie: ['BarFoo=OtherCookieData']}});
      });

      it('should pass through the cookies from client to the default api host', function () {
        req.get.withArgs('cookie').returns('default/-/FooBar=SomeCookieData');
        proxy(req, responseToClient);

        dataAdapter.request.should.have.been.calledOnce;
        dataAdapter.request.should.have.been.calledWithMatch(req, {headers: {cookie: ['FooBar=SomeCookieData']}})
      });
    });
  });

  describe('getApiPath', function() {
    it('should support no separator', function() {
      should.equal(apiProxy.getApiPath("/some/path/to/resource"), "/some/path/to/resource");
    });

    it('should support a separator but no api name', function() {
      should.equal(apiProxy.getApiPath("/-/path/to/resource"), "/path/to/resource");
    });

    it('should support a separator with api name', function() {
      should.equal(apiProxy.getApiPath("/api-name/-/path/to/resource"), "/path/to/resource");
    });
  });

  describe('getApiName', function() {
    it('should support no separator', function() {
      should.equal(apiProxy.getApiName("/some/path/to/resource"), null);
    });

    it('should support a separator but no api name', function() {
      should.equal(apiProxy.getApiName("/-/path/to/resource"), null);
    });

    it('should support a separator with api name', function() {
      should.equal(apiProxy.getApiName("/api-name/-/path/to/resource"), "api-name");
    });
  });

});
