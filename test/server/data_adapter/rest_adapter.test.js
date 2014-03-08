var chai = require('chai'),
  should = chai.should(),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  DataAdapter = require('../../../server/data_adapter'),
  RestAdapter = require('../../../server/data_adapter/rest_adapter');

chai.use(sinonChai);

describe('RestAdapter', function() {
  var restAdapter,
    request;

  beforeEach(function () {
    request = sinon.stub();
    restAdapter = new RestAdapter({request: request});
  });

  it('should have a default user agent', function () {
    restAdapter.options.userAgent.should.equal('Rendr RestAdapter; Node.js');
  });

  it('should be an instance of DataAdapter', function () {
    restAdapter.should.be.an.instanceof(DataAdapter);
  });

  describe('request', function () {
    var api, getErrForResponse;

    beforeEach(function () {
      restAdapter.options.default = {
        host: 'example.com',
        protocol: 'http'
      };

      api = { method: 'PUT', path: '/listings/1', body: {} };

      getErrForResponse = sinon.spy(restAdapter, 'getErrForResponse');
    });

    afterEach(function () {
      getErrForResponse.restore();
    });

    it('should pass through the error object', function () {
      var error = new Error('some error'),
        callback = sinon.spy();

      request.yields(error);
      restAdapter.request({}, api, callback);

      callback.should.have.been.calledOnce;
      callback.should.have.been.calledWithMatch({ message: 'some error' });
    });

    it('should convert the error code by default', function () {
      request.yields(null, {statusCode: 404});
      restAdapter.request({}, api, sinon.spy());

      getErrForResponse.should.have.been.called;
      getErrForResponse.should.have.been.calledWithMatch({ statusCode: 404 }, { allow4xx: false })
    });

    it('should allow to set options as 3rd argument instead of the callback', function () {
      var callback = sinon.spy();

      request.yields(null, {statusCode: 404});
      restAdapter.request({}, api, { convertErrorCode: false }, callback);

      callback.should.have.been.calledOnce;
      getErrForResponse.should.not.have.been.called;
    });

    describe('json response', function () {
      var response,
        callback,
        payload = { foo: 'bar'};

      beforeEach(function () {
        response = {
          statusCode: 200,
          body: JSON.stringify(payload),
          headers: {
            'content-type': 'application/json'
          }
        };

        callback = sinon.spy();
      });

      it('should parse valid json', function () {
        request.yields(null, response, response.body);
        restAdapter.request({}, api, callback);

        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWithMatch(null, response, payload);
      });

      it('should pass through the parse error for invalid json', function () {
        response.body = '{invalid json';
        request.yields(null, response, response.body);
        restAdapter.request({}, api, callback);

        callback.should.have.been.calledOnce;
        callback.should.have.been.calledWithMatch({message: 'Unexpected token i'});
      });
    });
  });

  describe('apiDefaults', function () {

    it('should set the url property if path contains a protocol', function () {
      var api = {
        path: 'http://www.example.com',
        query: { abc: 123 },
        body: {}
      };

      restAdapter.apiDefaults(api).should.have.property('url', 'http://www.example.com?abc=123');
    });

    it('should use the default api if no other is configured', function () {
      restAdapter.options.default = {
        host: 'example.com',
        protocol: 'https'
      };

      restAdapter.apiDefaults({body: {}}).should.have.property('url', 'https://example.com');
    });

    it('should use the configured api', function () {
      var api = {
          api: 'myCustomApi',
          body: {}
        };

      restAdapter.options.myCustomApi = {
        host: 'myCustomHost',
        protocol: 'http'
      };

      restAdapter.apiDefaults(api).should.have.property('url', 'http://myCustomHost');
    });

    it('should be able to overwrite the port, protocol and query', function () {
      var api = {
          protocol: 'https',
          port: 3001,
          query: { foo: 'bar' },
          api: 'myCustomApi',
          body: {}
        },
        expectedUrl = 'https://myCustomHost?foo=bar',
        result;

      restAdapter.options.myCustomApi = {
        host: 'myCustomHost',
        protocol: 'http',
        port: 3000
      };
      result = restAdapter.apiDefaults(api);

      result.should.have.property('url', expectedUrl);
      result.should.have.property('port', 3001);
    });

    it('should use a custom user agent', function () {
      var api = { headers: { 'User-Agent': 'custom user agent' }, body: {} };

      restAdapter.apiDefaults(api).headers.should.be.have.property('User-Agent', 'custom user agent');
    });

    describe('JSON support', function () {
      var api = {
        headers: {},
        body: {foo: 'bar'}
      };

      it('should make it JSON if content-type is undefined', function () {
        restAdapter.apiDefaults(api).should.have.property('json', api.body);
      });

      it('should make it JSON if content-type is "application/json"', function () {
        api.headers['Content-Type'] = 'application/json';
        restAdapter.apiDefaults(api).should.have.property('json', api.body);
      });

      it('should not set the json property for a different content-type', function () {
        api.headers['Content-Type'] = 'image/jpeg';
        restAdapter.apiDefaults(api).should.not.have.property('json');
      })
    });

    it('should not set "body" and "json" for GET requests with empty body', function () {
      var api = { method: 'GET', body: {} },
        result;

      result = restAdapter.apiDefaults(api)

      result.should.not.have.property('body');
      result.should.not.have.property('json');
    });

    it('should set the defaults', function () {
      var expectedApi = {
        method: 'GET',
        url: '',
        headers: {'User-Agent': 'Rendr RestAdapter; Node.js'}
      };

      restAdapter.apiDefaults({body: {}}).should.be.deep.equal(expectedApi);
    });
  });

  describe('getErrForResponse', function () {
    it('should convert 4xx and 5xx http responses to errors', function () {
      var response = {
          statusCode: 404,
          body: 'foo'
        },
        error = restAdapter.getErrForResponse(response);

      error.should.be.an.instanceof(Error);
      error.should.have.a.property('message', response.statusCode + ' status');
      error.should.have.a.property('status', response.statusCode);
      error.should.have.a.property('body', response.body);
    });
  });

  describe('isJSONResponse', function () {
    it('should return true if the given response content-type is appliction/json', function () {
      var response = {
        headers: {
          'content-type': 'application/json'
        }
      };

      restAdapter.isJSONResponse(response).should.be.true;
    });

    it('should return false if no content-type is given', function () {
      var response = { headers: {} };

      restAdapter.isJSONResponse(response).should.be.false;
    })
  });

});
