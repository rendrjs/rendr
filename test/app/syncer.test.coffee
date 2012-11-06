syncer = require('../../../app/syncer')
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
