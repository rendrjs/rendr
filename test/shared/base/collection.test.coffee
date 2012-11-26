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

      should.not.exist collection.params

      collection.fetch
        url: 'foo'
        data: params

      should.deepEqual params, collection.params
