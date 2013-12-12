var _ = require('underscore'),
    sinon = require('sinon'),
    apiProxy = require('./../../../server/middleware/apiProxy'),
    should = require('chai').should();

describe('apiProxy', function() {

  describe('middleware', function () {

    var dataAdater, proxy, responseToClient;

    beforeEach(function () {
      dataAdater = { request: sinon.stub() },
      proxy = apiProxy(dataAdater),
      responseToClient = { status: sinon.spy(), json: sinon.spy() };
    });

    it('should pass through the status code', function () {
      dataAdater.request.yields(null, {status: 200}, {});

      proxy({ path: '/' }, responseToClient);

      responseToClient.status.should.have.been.calledOnce;
    });

    it('should pass through the body', function () {
      var body = { what: 'ever' };
      dataAdater.request.yields(null, {status: 200}, body);

      proxy({ path: '/' }, responseToClient);

      responseToClient.json.should.have.been.calledOnce;
      responseToClient.json.should.have.been.calledWith(body);
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
