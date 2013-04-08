require('../../../shared/globals')
should = require('should')

BaseCollection = require('../../../shared/base/collection')
BaseModel = require('../../../shared/base/model')
modelUtils = require('../../../shared/modelUtils')
App = require('../../../shared/app')

describe 'BaseCollection', ->

  beforeEach ->
    @app = new App

  describe 'parse', ->

    beforeEach ->
      class @MyCollection extends BaseCollection
        jsonKey: 'my_collection'
        model:
          class MyModel extends BaseModel
            jsonKey: 'my_model'

      @collection = new @MyCollection([], {@app})

      models = [
        {id: 1, name: 'one'}
        {id: 2, name: 'two'}
      ]

      modelsNested = [
        {my_model: {id: 1, name: 'one'}}
        {my_model: {id: 2, name: 'two'}}
      ]

      @denested = models
      @nested =
        my_collection: models

      @denestedModelsNested = modelsNested
      @nestedModelsNested =
        my_collection: modelsNested

    it "should not de-nest collection if not nested collection", ->
      @collection.parse(@denested).should.eql @denested

    it "should de-nest collection if nested collection", ->
      @collection.parse(@nested).should.eql @denested

    it "should de-nest models if nested models", ->
      @collection.parse(@denestedModelsNested).should.eql @denested

    it "should de-nest collection and models if nested collection and models", ->
      @collection.parse(@nestedModelsNested).should.eql @denested

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

  describe "store", ->

    beforeEach ->
      @app.fetcher.modelStore.clear()
      @app.fetcher.collectionStore.clear()
      class @MyCollection extends BaseCollection
      modelUtils.addClassMapping @MyCollection.name, @MyCollection

    it "should store its models in the modelStore and params in collectionStore", ->
      models = [{id: 1, foo: 'bar'}, {id: 2, foo: 'bot'}]
      meta =
        item1: 'value1'
        item2: 'value2'

      collection = new @MyCollection(models, {meta: meta, app: @app})
      collection.store()

      models.forEach (modelAttrs) =>
        storedModel = @app.fetcher.modelStore.get collection.model.name, modelAttrs.id
        storedModel.should.eql modelAttrs

      storedCollection = @app.fetcher.collectionStore.get @MyCollection.name, collection.params
      storedCollection.ids.should.eql _.pluck(models, 'id')
      storedCollection.meta.should.eql meta

