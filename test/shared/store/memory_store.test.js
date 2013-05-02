var MemoryStore, should;

MemoryStore = require('../../../shared/store/memory_store');
should = require('should');

describe('MemoryStore', function() {
  beforeEach(function() {
    this.store = new MemoryStore;
  });

  it("should undefined for missing keys", function() {
    this.store.get('foobar', function(err, value) {
      should.equal(value, void 0);
    });
  });

  it("should set and get a key + value", function() {
    this.store.set('cached_value', 42);
    this.store.get('cached_value', function(err, value) {
      should.equal(value, 42);
    });
    this.store.set('cached_value', 'new value');
    this.store.get('cached_value', function(err, value) {
      should.equal(value, 'new value');
    });
  });

  it("should be able to clear a key", function() {
    this.store.set('somethin', 'some value');
    this.store.clear('somethin');
    this.store.get('somethin', function(err, value) {
      should.equal(value, void 0);
    });
  });

  it("should be able to expire a key", function(done) {
    var _this = this;

    this.store.set('will_expire', '1234', 0.01);
    this.store.get('will_expire', function(err, value) {
      should.equal(value, '1234');
    });
    setTimeout(function() {
      _this.store.get('will_expire', function(err, value) {
        should.equal(value, void 0);
      });
      done();
    }, 11);
  });
});
