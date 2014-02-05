var MemoryStore = require('../../../shared/store/memory_store'),
    should = require('chai').should();

describe('MemoryStore', function() {
  var store;

  beforeEach(function() {
    store = new MemoryStore();
  });

  it("should undefined for missing keys", function() {
    store.get('foobar', function(err, value) {
      should.equal(value, void 0);
    });
  });

  it("should set and get a key + value", function() {
    store.set('cached_value', 42);
    store.get('cached_value', function(err, value) {
      should.equal(value, 42);
    });
    store.set('cached_value', 'new value');
    store.get('cached_value', function(err, value) {
      should.equal(value, 'new value');
    });
  });

  it("should be able to clear a key", function() {
    store.set('somethin', 'some value');
    store.clear('somethin');
    store.get('somethin', function(err, value) {
      should.equal(value, void 0);
    });
  });

  it("should be able to expire a key", function(done) {
    store.set('will_expire', '1234', 0.01);
    store.get('will_expire', function(err, value) {
      should.equal(value, '1234');
    });
    setTimeout(function() {
      store.get('will_expire', function(err, value) {
        should.equal(value, void 0);
      });
      done();
    }, 11);
  });
});
