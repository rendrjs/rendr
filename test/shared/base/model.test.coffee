require('../../../shared/globals')
should = require('should')

BaseModel = require('../../../shared/base/model')
fetcher = require('../../../shared/fetcher')
modelUtils = require('../../../shared/model_utils')

describe 'BaseModel', ->

  it "should update modelStore when values change", ->
    attrs =
      id: 9
      status: 'pending'

    class MyModel extends BaseModel
    modelUtils.addClassMapping(MyModel.name, MyModel)

    model = new MyModel(attrs)

    stored = fetcher.modelStore.get(MyModel.name, model.id)
    should.not.exist(stored)

    fetcher.modelStore.set(MyModel.name, model)
    stored = fetcher.modelStore.get(MyModel.name, model.id)
    stored.should.eql attrs

    # Change an attribute, make sure the store gets updated.
    attrs.status = 'accepted'
    model.set(status: attrs.status)
    stored = fetcher.modelStore.get(MyModel.name, model.id)
    stored.should.eql attrs

    # Add an attribute, make sure the store gets updated.
    attrs.name = 'Bobert'
    model.set(name: attrs.name)
    stored = fetcher.modelStore.get(MyModel.name, model.id)
    stored.should.eql attrs
