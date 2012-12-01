require('../../../shared/globals')
ModelStore = require('../../../shared/store/model_store')
should = require('should')
BaseModel = require('../../../shared/base/model')
modelUtils = require('../../../shared/model_utils')

modelUtils.addClassMapping 'base_model', BaseModel

describe 'ModelStore', ->

  beforeEach ->
    @store = new ModelStore

  it "should get and set the values for a model", ->
    modelAttrs =
      foo: 'bar'
      id: 1
    model = new BaseModel(modelAttrs)
    @store.set 'base_model', model
    result = @store.get('base_model', 1)
    result.should.eql modelAttrs

  it "should support returning a model instance", ->
    modelAttrs =
      foo: 'bar'
      id: 1
    model = new BaseModel(modelAttrs)
    @store.set 'base_model', model
    resultModel = @store.get('base_model', 1, true)
    resultModel.should.be.an.instanceOf BaseModel
    resultModel.toJSON().should.eql modelAttrs

  it "should merge model attrs when setting", ->
    firstModelAttrs =
      foo: 'bar'
      id: 1
    secondModelAttrs =
      bam: 'baz'
      id: 1
    finalModelAttrs = _.extend({}, firstModelAttrs, secondModelAttrs)

    model = new BaseModel(firstModelAttrs)
    @store.set 'base_model', model

    model = new BaseModel(secondModelAttrs)
    @store.set 'base_model', model

    result = @store.get 'base_model', 1
    result.should.eql finalModelAttrs
