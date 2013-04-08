require('../../../shared/globals')
should = require('should')

BaseModel = require('../../../shared/base/model')
modelUtils = require('../../../shared/modelUtils')
App = require('../../../shared/app')

describe 'BaseModel', ->

  beforeEach ->
    @app = new App
    @app.fetcher.modelStore.clear()
    class @MyModel extends BaseModel
    modelUtils.addClassMapping(@MyModel.name, @MyModel)


  it "should update modelStore when values change", ->
    attrs =
      id: 9
      status: 'pending'

    model = new @MyModel(attrs, {@app})

    stored = @app.fetcher.modelStore.get(@MyModel.name, model.id)
    should.not.exist(stored)

    @app.fetcher.modelStore.set(model)
    stored = @app.fetcher.modelStore.get(@MyModel.name, model.id)
    stored.should.eql attrs

    # Change an attribute, make sure the store gets updated.
    attrs.status = 'accepted'
    model.set(status: attrs.status)
    stored = @app.fetcher.modelStore.get(@MyModel.name, model.id)
    stored.should.eql attrs

    # Add an attribute, make sure the store gets updated.
    attrs.name = 'Bobert'
    model.set(name: attrs.name)
    stored = @app.fetcher.modelStore.get(@MyModel.name, model.id)
    stored.should.eql attrs

  describe 'store', ->

    it "should store the model", ->
      attrs =
        id: 938
        type: 'foobiz'
      model = new @MyModel(attrs, {@app})
      model.store()
      stored = @app.fetcher.modelStore.get(@MyModel.name, model.id)
      stored.should.eql attrs
