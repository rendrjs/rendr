require('../../shared/globals')
ModelStore = require('../../shared/model_store')
should = require('should')
BaseModel = require('../../shared/base/model')
modelUtils = require('../../shared/model_utils')

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
    resultModel = @store.get 'base_model', 1
    should.deepEqual(resultModel.toJSON(), modelAttrs)

  it "should merge model attrs when setting", ->
    firstModelAttrs =
      foo: 'bar'
      id: 1
    secondModelAttrs =
      bam: 'baz'
      id: 1
    finalModelAttrs = _.extend {}, firstModelAttrs, secondModelAttrs

    model = new BaseModel(firstModelAttrs)
    @store.set 'base_model', model

    model = new BaseModel(secondModelAttrs)
    @store.set 'base_model', model

    resultModel = @store.get 'base_model', 1
    should.deepEqual(resultModel.toJSON(), finalModelAttrs)
