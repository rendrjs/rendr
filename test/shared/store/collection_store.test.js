var should = require('chai').should(),
    util = require('util'),
    CollectionStore = require('../../../shared/store/collection_store'),
    BaseCollection = require('../../../shared/base/collection'),
    BaseModel = require('../../../shared/base/model'),
    ModelUtils = require('../../../shared/modelUtils'),
    modelUtils = new ModelUtils(),
    AddClassMapping = require('../../helpers/add_class_mapping'),
    addClassMapping = new AddClassMapping(modelUtils);

addClassMapping.add(BaseCollection.name, BaseCollection);

describe('CollectionStore', function() {
  beforeEach(function() {
    this.store = new CollectionStore({modelUtils: modelUtils});
    this.store.clear();
  });

  it("should set a collection and retrieve its ids and meta", function() {
    var collection, meta, models, params, results;

    models = [
      {
        foo: 'bar',
        id: 1
      }, {
        foo: 'bot',
        id: 2
      }
    ];
    meta = {
      location: 'san francisco'
    };
    params = {
      items_per_page: 10
    };
    collection = new BaseCollection(models, {
      meta: meta,
      params: params
    });
    this.store.set(collection, params);
    results = this.store.get(collection.constructor.name, params);
    results.should.eql({
      ids: collection.pluck('id'),
      meta: meta,
      params: params
    });
  });

  it("should support custom idAttribute for models", function() {
    var collection, meta, models, params, results;

    models = [
      {
        foo: 'bar',
        login: 1
      }, {
        foo: 'bot',
        login: 2
      }
    ];
    meta = {
      location: 'san francisco'
    };
    params = {
      items_per_page: 10
    };

    function MyModel() {
      MyModel.super_.apply(this, arguments);
    }
    util.inherits(MyModel, BaseModel);

    MyModel.prototype.idAttribute = 'login';

    function MyCollection() {
      MyCollection.super_.apply(this, arguments);
    }
    util.inherits(MyCollection, BaseCollection);

    MyCollection.prototype.model = MyModel;

    collection = new MyCollection(models, {
      meta: meta,
      params: params
    });
    this.store.set(collection, params);
    addClassMapping.add(collection.constructor.name, MyCollection);
    results = this.store.get(collection.constructor.name, params);
    results.should.eql({
      ids: collection.pluck('login'),
      meta: meta,
      params: params
    });
  });

  it("should treat different params as different collections", function() {
    var collection0, collection10, models0, models10, params0, params10, results0, results10;

    models0 = [
      {
        foo: 'bar',
        id: 1
      }, {
        foo: 'bot',
        id: 2
      }
    ];
    models10 = [
      {
        foo: 'bar',
        id: 11
      }, {
        foo: 'bot',
        id: 12
      }
    ];
    params0 = {
      offset: 0
    };
    collection0 = new BaseCollection(models0, {params: params0});
    this.store.set(collection0, params0);
    params10 = {offset: 10};
    collection10 = new BaseCollection(models10, {params: params10});
    this.store.set(collection10, params10);
    results0 = this.store.get(collection0.constructor.name, params0);
    results0.should.eql({
      ids: collection0.pluck('id'),
      meta: {},
      params: params0
    });
    results10 = this.store.get(collection10.constructor.name, params10);
    results10.should.eql({
      ids: collection10.pluck('id'),
      meta: {},
      params: params10
    });
  });

  it("should retrieve collections without regard to params order", function() {
    var collection, models, params0, params1, results;

    models = [
      {
        foo: 'bar',
        id: 1
      }, {
        foo: 'bot',
        id: 2
      }
    ];
    params0 = {
      offset: 0,
      items_per_page: 20
    };
    params1 = {
      items_per_page: 20,
      offset: 0
    };
    collection = new BaseCollection(models, {
      params: params0
    });
    this.store.set(collection, params0);
    results = this.store.get(collection.constructor.name, params1);
    should.exist(results);
    results.ids.should.eql(collection.pluck('id'));
  });
});
