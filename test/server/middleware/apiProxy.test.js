var _ = require('underscore'),
    sinon = require('sinon'),
    apiProxy = require('./../../../server/middleware/apiProxy'),
    should = require('chai').should();

describe('apiProxy', function() {

  describe('middleware', function () {

    var dataAdater, proxy, requestFromClient, responseToClient, requestToApi;

    beforeEach(function () {
      requestToApi = sinon.stub();
      requestFromClient = {
        path: '/',
        headers: { 'host': 'any.host.name', },
        connection: {}
      },
      dataAdater = { request: requestToApi },
      proxy = apiProxy(dataAdater),
      responseToClient = { status: sinon.spy(), json: sinon.spy() };
    });

    it('should pass through the status code', function () {
      dataAdater.request.yields(null, {status: 200}, {});

      proxy(requestFromClient, responseToClient);

      responseToClient.status.should.have.been.calledOnce;
    });

    it('should pass through the body', function () {
      var body = { what: 'ever' };
      dataAdater.request.yields(null, {status: 200}, body);

      proxy(requestFromClient, responseToClient);

      responseToClient.json.should.have.been.calledOnce;
      responseToClient.json.should.have.been.calledWith(body);
    });

    it('should add an x-forwarded-for header to the request', function () {
      var remoteAddress = '1.1.1.1',
          outgoingHeaders;

      requestFromClient.ip = remoteAddress;

      proxy(requestFromClient, responseToClient);

      requestToApi.should.have.been.calledOnce;
      outgoingHeaders = requestToApi.firstCall.args[1].headers;
      outgoingHeaders['x-forwarded-for'].should.eq(remoteAddress);
    });

    it('should extend an existing x-forwarded-for header', function () {
      var existingHeaderValue = '9.9.9.9, 6.6.6.6',
          remoteAddress = '1.1.1.1',
          expectedHeaderValue = '9.9.9.9, 6.6.6.6, 1.1.1.1',
          incomingHeaders = { 'x-forwarded-for': existingHeaderValue },
          outgoingHeaders;

      requestFromClient.headers = incomingHeaders;
      requestFromClient.ip = remoteAddress;

      proxy(requestFromClient, responseToClient);

      requestToApi.should.have.been.calledOnce;
      outgoingHeaders = requestToApi.firstCall.args[1].headers;
      outgoingHeaders['x-forwarded-for'].should.eq(expectedHeaderValue);
      outgoingHeaders['x-forwarded-for'].should.not.eq(
        incomingHeaders['x-forwarded-for']);
    });


   it('should not pass through the host header', function () {
      proxy(requestFromClient, responseToClient);
      outgoingHeaders = requestToApi.firstCall.args[1].headers;
      outgoingHeaders.should.not.contain.key('host');
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
