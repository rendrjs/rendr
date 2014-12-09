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

  it("should set a collection and retrieve its instance", function() {
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
    results.should.be.equal(collection);
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
    results.should.be.equal(collection);
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
    results0.should.be.equal(collection0);
    results10 = this.store.get(collection10.constructor.name, params10);
    results10.should.be.equal(collection10);
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
    results.should.be.equal(collection);
  });

  context("there is data to be cleared", function() {
    var collection, collection2, anotherCollection, models, models2, modelsAnother,
      params, params2, resultsCollection;

    beforeEach(function() {
      models = [
        {
          foo: 'bar',
          id: 1
        }, {
          foo: 'bot',
          id: 2
        }
      ];        
      models2 = [
        {
          foo: 'bar',
          id: 11
        }, {
          foo: 'bot',
          id: 12
        }
      ];        
      modelsAnother = [
        {
          foo: 'bee',
          id: 111
        }, {
          foo: 'hum',
          id: 112
        }
      ];
      params = {
        offset: 0
      };
      params2 = {offset: 10};
      collection = new BaseCollection(models, {params: params});
      collection2 = new BaseCollection(models2, {params: params2});        

      function AnotherCollection() {
        AnotherCollection.super_.apply(this, arguments);
      }
      util.inherits(AnotherCollection, BaseCollection);

      anotherCollection = new AnotherCollection(modelsAnother, {params: params });      
    });

    it("should allow clearing out of the store by params", function() {
      this.store.set(collection, params);
      this.store.set(collection2, params2);
      this.store.clear(collection.constructor.name, params);
      resultsCollection = this.store.get(collection.constructor.name, params);
      should.not.exist(resultsCollection);
      resultsCollection = this.store.get(collection2.constructor.name, params2);
      should.exist(resultsCollection);
    });  

    it("should allow clearing a collection out of the store", function() {
      this.store.set(collection, params);
      this.store.set(collection2, params2);
      this.store.set(anotherCollection, params);

      resultsCollection = this.store.get(collection.constructor.name, params);
      should.exist(resultsCollection);
      resultsCollection = this.store.get(collection2.constructor.name, params2);
      should.exist(resultsCollection);

      this.store.clear(collection.constructor.name);
      resultsCollection = this.store.get(collection.constructor.name, params);
      should.not.exist(resultsCollection);
      resultsCollection = this.store.get(collection2.constructor.name, params2);
      should.not.exist(resultsCollection);
      this.store.cache.should.not.be.empty;
    });


    it("should allow clearing out the store", function() {
      this.store.set(collection, params);
      this.store.set(collection2, params2);
      this.store.set(anotherCollection, params);

      this.store.clear();
      resultsCollection = this.store.get(collection.constructor.name, params);
      should.not.exist(resultsCollection);
      resultsCollection = this.store.get(collection2.constructor.name, params2);
      should.not.exist(resultsCollection);
      this.store.cache.should.be.empty;
    });
  });
});
