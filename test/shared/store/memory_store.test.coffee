MemoryStore = require('../../../shared/store/memory_store')
should = require('should')

describe 'MemoryStore', ->

  beforeEach ->
    @store = new MemoryStore

  it "should return undefined for missing keys", ->
    @store.get 'foobar', (err, value) -> should.equal value, undefined

  it "should set and get a key + value", ->
    @store.set 'cached_value', 42
    @store.get 'cached_value', (err, value) -> should.equal value, 42

    @store.set 'cached_value', 'new value'
    @store.get 'cached_value', (err, value) -> should.equal value, 'new value'

  it "should be able to clear a key", ->
    @store.set 'somethin', 'some value'
    @store.clear 'somethin'
    @store.get 'somethin', (err, value) -> should.equal value, undefined

  it "should be able to expire a key", (done) ->
    @store.set 'will_expire', '1234', 0.01
    @store.get 'will_expire', (err, value) -> should.equal value, '1234'
    setTimeout =>
      @store.get 'will_expire', (err, value) -> should.equal value, undefined
      done()
    , 11

