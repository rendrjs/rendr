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


  describe 'objectsDiffer', ->

    describe 'flat objects', ->

      beforeEach ->
        @obj1 =
          foo: 'bar1'
          baz: 'bam1'
        @obj2 = _.clone(@obj1)

      it "should assert equality", ->
        syncer.objectsDiffer(@obj1, @obj2).should.be.false
        syncer.objectsDiffer(@obj2, @obj1).should.be.false

      it "should work for string values", ->
        @obj2.foo = 'xxx'
        syncer.objectsDiffer(@obj1, @obj2).should.be.true
        syncer.objectsDiffer(@obj2, @obj1).should.be.true

      it "should work for comparing obj to null", ->
        @obj2.foo = null
        syncer.objectsDiffer(@obj1, @obj2).should.be.true
        syncer.objectsDiffer(@obj2, @obj1).should.be.true

      it "should work for comparing obj to non-existant value", ->
        @obj2.other = 'something'
        syncer.objectsDiffer(@obj1, @obj2).should.be.true
        syncer.objectsDiffer(@obj2, @obj1).should.be.true

    describe 'nested objects', ->

      beforeEach ->
        @obj1 =
          foo: 'bar1'
          subobj:
            nil: null
            bool: true
            obj: {harder:'faster'}
          arr: [1, 2, 3]
        @obj2 = _.clone(@obj1)

      it "should assert equality", ->
        syncer.objectsDiffer(@obj1, @obj2).should.be.false
        syncer.objectsDiffer(@obj2, @obj1).should.be.false

    describe 'arrays', ->

      it "should be equal if empty", ->
        @obj1 = []
        @obj2 = []
        syncer.objectsDiffer(@obj1, @obj2).should.be.false
        syncer.objectsDiffer(@obj2, @obj1).should.be.false

      it "should be equal if non-empty", ->
        @obj1 = [1, 2, 3]
        @obj2 = [1, 2, 3]
        syncer.objectsDiffer(@obj1, @obj2).should.be.false
        syncer.objectsDiffer(@obj2, @obj1).should.be.false

      it "should not be equal if different order", ->
        @obj1 = [1, 2, 3]
        @obj2 = [1, 3, 2]
        syncer.objectsDiffer(@obj1, @obj2).should.be.true
        syncer.objectsDiffer(@obj2, @obj1).should.be.true

      it "should not be equal if different values", ->
        @obj1 = [1, 2, 3]
        @obj2 = [1, 2]
        syncer.objectsDiffer(@obj1, @obj2).should.be.true
        syncer.objectsDiffer(@obj2, @obj1).should.be.true

        @obj1 = []
        @obj2 = [1, 3, 2]
        syncer.objectsDiffer(@obj1, @obj2).should.be.true
        syncer.objectsDiffer(@obj2, @obj1).should.be.true
