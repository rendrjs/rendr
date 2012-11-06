var statsd = require(__dirname + '/../../../lib/statsd');
var expect = require('expect.js');
var should = require('should');
var _ = require('underscore');

var testConfig = {
  host: '127.0.0.1',
  port: 8125
}

/**
  These tests are pretty weak, but at least we verify that the api is supported
*/
describe('statsd', function() {

  beforeEach(function(done) {
    statsd.init(testConfig, undefined, done);
  });

  it('should support timing', function(done) {
    var key = statsd.timing('test.timing', 100);
    key.should.equal('moweb-node.test.timing');
    done();
  });

  it('should support increment', function(done) {
    var key = statsd.increment('test.inc');
    key.should.equal('moweb-node.test.inc')
    done();
  });

  it('should support decrement', function(done) {
    var key = statsd.decrement('test.dec');
    key.should.equal('moweb-node.test.dec')
    done();
  });

});