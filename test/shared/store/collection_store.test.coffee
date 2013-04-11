require('../../../shared/globals')
CollectionStore = require('../../../shared/store/collection_store')
should = require('should')
BaseCollection = require('../../../shared/base/collection')
BaseModel = require('../../../shared/base/model')
modelUtils = require('../../../shared/modelUtils')

modelUtils.addClassMapping BaseCollection.name, BaseCollection

describe 'CollectionStore', ->

  beforeEach ->
    @store = new CollectionStore
    @store.clear()

  it "should set a collection and retrieve its ids and meta", ->
    models = [{
      foo: 'bar'
      id: 1
    },{
      foo: 'bot'
      id: 2
    }]
    meta =
      location: 'san francisco'
    params =
      items_per_page: 10
    collection = new BaseCollection(models, meta: meta, params: params)
    @store.set collection, params
    results = @store.get collection.constructor.name, params
    results.should.eql
      ids: collection.pluck('id')
      meta: meta

  it "should support custom idAttribute for models", ->
    models = [{
      foo: 'bar'
      login: 1
    },{
      foo: 'bot'
      login: 2
    }]
    meta =
      location: 'san francisco'
    params =
      items_per_page: 10

    class MyModel extends BaseModel
      idAttribute: 'login'
    class MyCollection extends BaseCollection
      model: MyModel

    collection = new MyCollection(models, meta: meta, params: params)
    @store.set collection, params
    modelUtils.addClassMapping collection.constructor.name, MyCollection
    results = @store.get collection.constructor.name, params
    results.should.eql
      ids: collection.pluck('login')
      meta: meta

  it "should treat different params as different collections", ->
    models0 = [{
      foo: 'bar'
      id: 1
    },{
      foo: 'bot'
      id: 2
    }]
    models10 = [{
      foo: 'bar'
      id: 11
    },{
      foo: 'bot'
      id: 12
    }]

    params0 = offset: 0
    collection0 = new BaseCollection(models0, params: params0)
    @store.set collection0, params0

    params10 = offset: 10
    collection10 = new BaseCollection(models10, params: params10)
    @store.set collection10, params10

    results0 = @store.get collection0.constructor.name, params0
    results0.should.eql
      ids: collection0.pluck('id')
      meta: {}

    results10 = @store.get collection10.constructor.name, params10
    results10.should.eql
      ids: collection10.pluck('id')
      meta: {}

  it "should retrieve collections without regard to params order", ->
    models = [{
      foo: 'bar'
      id: 1
    },{
      foo: 'bot'
      id: 2
    }]

    params0 =
      offset: 0
      items_per_page: 20

    params1 =
      items_per_page: 20
      offset: 0

    collection = new BaseCollection(models, params: params0)
    @store.set collection, params0

    results = @store.get collection.constructor.name, params1
    should.exist(results)
    results.ids.should.eql collection.pluck('id')
