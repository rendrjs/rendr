syncer = require('../../shared/syncer')
Backbone = require('backbone')
should = require('should')

describe 'syncer', ->

  describe 'interpolateParams', ->

    beforeEach ->
      @model = new Backbone.Model(id: 42)

    it 'should interpolate params', ->
      url = syncer.interpolateParams(@model, '/listings/:id')
      url.should.equal '/listings/42'

    it 'should interpolate the same param multiple times', ->
      url = syncer.interpolateParams(@model, '/special/:id/url/:id')
      url.should.equal '/special/42/url/42'

    it 'should delete any interpolated properties from an optional params hash', ->
      params =
        id: 42
        foo: 'bar'
      url = syncer.interpolateParams(@model, '/listings/:id', params)
      url.should.equal '/listings/42'
      params.should.eql {foo: 'bar'}
