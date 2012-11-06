var airApi = require(__dirname + '/../../../lib/airApi');
var expect = require('expect.js');
var should = require('should');
var _ = require('underscore');

var testConfig = {
  host: 'http://testhost.com:3030',
  key: 'abcde'
}


describe('airbnbApi', function() {

  beforeEach(function(done) {
    airApi.init(testConfig, done);
  });

  it('should retrieve default search api', function(done) {
    var api = airApi.search();
    api.method.should.equal('get');
    api.protocol.should.equal('http:');
    api.hostname.should.equal('testhost.com');
    api.port.should.equal('3030');
    api.pathname.should.equal('/v1/listings/search');
    api.query.should.have.keys('key');
    api.query.key.should.equal('abcde');
    done();
  });

  it('should retrieve search api', function(done) {
    var api = airApi.search({params: {location:'san francisco', locale:'en_US'}});
    api.method.should.equal('get');
    api.protocol.should.equal('http:');
    api.hostname.should.equal('testhost.com');
    api.port.should.equal('3030');
    api.pathname.should.equal('/v1/listings/search');
    api.query.should.have.keys('key', 'location','locale');
    api.query.location.should.equal('san francisco');
    api.query.locale.should.equal('en_US');
    api.query.key.should.equal('abcde');
    done();
  });


  it('should retrieve currencies api', function(done) {
    var api = airApi.currencies();
    api.method.should.equal('get');
    api.protocol.should.equal('http:');
    api.hostname.should.equal('testhost.com');
    api.port.should.equal('3030');
    api.pathname.should.equal('/v1/currencies');
    api.query.should.have.keys('key');
    api.query.key.should.equal('abcde');
    done();
  });


  it('should retrieve phrases api', function(done) {
    var api = airApi.phrases();
    api.method.should.equal('get');
    api.protocol.should.equal('http:');
    api.hostname.should.equal('testhost.com');
    api.port.should.equal('3030');
    api.pathname.should.equal('/v1/phrases/mobile_web');
    api.query.should.have.keys('key');
    api.query.key.should.equal('abcde');
    done();
  });

  it('should retrieve locales api', function(done) {
    var api = airApi.locales();
    api.method.should.equal('get');
    api.protocol.should.equal('http:');
    api.hostname.should.equal('testhost.com');
    api.port.should.equal('3030');
    api.pathname.should.equal('/v1/locales');
    api.query.should.have.keys('key');
    api.query.key.should.equal('abcde');
    done();
  });

});