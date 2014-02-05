var MemoryStore = require('../../../shared/store/memory_store'),
    sinon = require('sinon'),
    should = require('chai').should();

describe('MemoryStore', function() {
  var store;

  beforeEach(function() {
    store = new MemoryStore();
  });

  it('should return undefined for missing keys', function() {
    var value = store.get('foobar');
    should.not.exist(value);
  });

  it('should set and get a key + value', function() {
    store.set('cached_value', 42);
    store.get('cached_value').should.equal(42);

    store.set('cached_value', 'new value');
    store.get('cached_value').should.equal('new value');
  });

  it('should be able to clear a key', function() {
    var value;

    store.set('somethin', 'some value');
    store.clear('somethin');
    value = store.get('somethin');

    should.not.exist(value);
  });

  it('should be able to expire a key', function() {
    var value,
      fakeTimer = sinon.useFakeTimers();

    store.set('will_expire', '1234', 0.01);
    value = store.get('will_expire');
    value.should.equal('1234');

    fakeTimer.tick(11);
    value = store.get('will_expire');
    should.not.exist(value);

    fakeTimer.restore();
  });
});
