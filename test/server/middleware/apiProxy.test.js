var _ = require('underscore'),
    apiProxy = require('./../../../server/middleware/apiProxy'),
    should = require('should');

describe('apiProxy', function() {

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