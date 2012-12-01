require('../../../shared/globals')
should = require('should')

BaseCollection = require('../../../shared/base/collection')

describe 'BaseCollection', ->

  describe 'fetch', ->

    it "sould store params used", ->
      params =
        items_per_page: 10
        offset: 30

      collection = new BaseCollection

      # Make 'sync' a noop.
      collection.sync = ->

      collection.params.should.eql {}

      collection.fetch
        url: 'foo'
        data: params

      should.deepEqual params, collection.params

  describe 'meta', ->

    it "should store 'meta' on initialization", ->
      collection = new BaseCollection
      collection.meta.should.eql {}

      meta =
        foo: 'bar'
      collection = new BaseCollection([], {meta: meta})
      collection.meta.should.eql meta

    it "should store 'meta' when parsing, and there is a jsonKey", ->
      meta =
        foo: 'bar'

      resp = [{id: 1, foo: 'bar'}, {id: 2, foo: 'bot'}]
      jsonKeyResp = _.extend {}, meta,
        base_collection: resp

      collection = new BaseCollection
      collection.parse(resp)
      collection.meta.should.eql {}

      collection.jsonKey = 'base_collection'
      collection.parse(jsonKeyResp)
      collection.meta.should.eql meta
