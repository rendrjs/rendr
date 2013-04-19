require('../../../shared/globals')
ModelStore = require('../../../shared/store/model_store')
should = require('should')
BaseModel = require('../../../shared/base/model')
modelUtils = require('../../../shared/modelUtils')

class MyModel extends BaseModel
class App

modelUtils.addClassMapping modelUtils.modelName(MyModel), MyModel

describe 'ModelStore', ->

  beforeEach ->
    @app = new App
    @store = new ModelStore({@app})

  it "should get and set the values for a model", ->
    modelAttrs =
      foo: 'bar'
      id: 1
    model = new MyModel(modelAttrs)
    @store.set(model)
    result = @store.get('my_model', 1)
    result.should.eql modelAttrs

  it "should support custom idAttribute", ->
    modelAttrs =
      foo: 'bar'
      login: 'homeslice'
    class MyCustomModel extends BaseModel
      idAttribute: 'login'
    model = new MyCustomModel(modelAttrs)
    @store.set(model)
    result = @store.get(modelUtils.modelName(MyCustomModel), modelAttrs.login)
    result.should.eql modelAttrs

  it "should support returning a model instance", ->
    modelAttrs =
      foo: 'bar'
      id: 1
    model = new MyModel(modelAttrs)
    @store.set(model)
    resultModel = @store.get('my_model', 1, true)
    resultModel.should.be.an.instanceOf BaseModel
    resultModel.toJSON().should.eql modelAttrs
    resultModel.app.should.eql @app

  it "should merge model attrs when setting", ->
    firstModelAttrs =
      foo: 'bar'
      id: 1
    secondModelAttrs =
      bam: 'baz'
      id: 1
    finalModelAttrs = _.extend({}, firstModelAttrs, secondModelAttrs)

    model = new MyModel(firstModelAttrs)
    @store.set(model)

    model = new MyModel(secondModelAttrs)
    @store.set(model)

    result = @store.get 'my_model', 1
    result.should.eql finalModelAttrs
