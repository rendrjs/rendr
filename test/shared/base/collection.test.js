var _ = require('underscore'),
    should = require('chai').should(),
    BaseCollection = require('../../../shared/base/collection'),
    BaseModel = require('../../../shared/base/model'),
    App = require('../../../shared/app'),
    ModelUtils = require('../../../shared/modelUtils'),
    AddClassMapping = require('../../helpers/add_class_mapping');

describe('BaseCollection', function() {
  beforeEach(function() {
    this.app = new App();
    this.addClassMapping = new AddClassMapping(this.app.modelUtils)
  });

  describe('parse', function() {
    beforeEach(function() {
      var models, modelsNested;

      this.MyCollection = BaseCollection.extend({
        jsonKey: 'my_collection',
        model: BaseModel.extend({
          jsonKey: 'my_model'
        })
      });

      this.collection = new this.MyCollection([], {
        app: this.app
      });

      models = [{
        id: 1,
        name: 'one'
      }, {
        id: 2,
        name: 'two'
      }];
      modelsNested = [{
        my_model: {
          id: 1,
          name: 'one'
        }
      }, {
        my_model: {
          id: 2,
          name: 'two'
        }
      }];
      this.denested = models;
      this.nested = {
        my_collection: models
      };
      this.denestedModelsNested = modelsNested;
      this.nestedModelsNested = {
        my_collection: modelsNested
      };
    });

    it("should not de-nest collection if not nested collection", function() {
      this.collection.parse(this.denested).should.eql(this.denested);
    });

    it("should de-nest collection if nested collection", function() {
      this.collection.parse(this.nested).should.eql(this.denested);
    });

    it("should de-nest models if nested models", function() {
      this.collection.parse(this.denestedModelsNested).should.eql(this.denested);
    });

    it("should de-nest collection and models if nested collection and models", function() {
      this.collection.parse(this.nestedModelsNested).should.eql(this.denested);
    });
  });

  describe('fetch', function() {
    it("sould store params used", function() {
      var collection, params;

      params = {
        items_per_page: 10,
        offset: 30
      };
      collection = new BaseCollection();
      collection.sync = function() {};
      collection.params.should.eql({});
      collection.fetch({
        url: 'foo',
        data: params
      });
      params.should.deep.equal(collection.params);
    });
  });

  describe('meta', function() {
    it("should store 'meta' on initialization", function() {
      var collection, meta;

      collection = new BaseCollection();
      collection.meta.should.eql({});
      meta = {
        foo: 'bar'
      };
      collection = new BaseCollection([], {
        meta: meta
      });
      collection.meta.should.eql(meta);
    });

    it("should store 'meta' when parsing, and there is a jsonKey", function() {
      var collection, jsonKeyResp, meta, resp;

      meta = {
        foo: 'bar'
      };
      resp = [{
        id: 1,
        foo: 'bar'
      }, {
        id: 2,
        foo: 'bot'
      }];
      jsonKeyResp = _.extend({}, meta, {
        baseCollection: resp
      });
      collection = new BaseCollection();
      collection.parse(resp);
      collection.meta.should.eql({});
      collection.jsonKey = 'baseCollection';
      collection.parse(jsonKeyResp);
      collection.meta.should.eql(meta);
    });
  });

  describe("store", function() {
    beforeEach(function() {
      this.app.fetcher.modelStore.clear();
      this.app.fetcher.collectionStore.clear();

      this.MyCollection = BaseCollection.extend({});

      this.addClassMapping.add(this.MyCollection.name, this.MyCollection);
    });

    it("should store its models in the modelStore and params in collectionStore", function() {
      var collection, meta, models, storedCollection,
        _this = this;

      models = [{
          id: 1,
          foo: 'bar'
        }, {
          id: 2,
          foo: 'bot'
        }];

      meta = {
        item1: 'value1',
        item2: 'value2'
      };
      collection = new this.MyCollection(models, {
        meta: meta,
        app: this.app
      });
      collection.store();
      models.forEach(function(modelAttrs) {
        var storedModel = _this.app.fetcher.modelStore.get(collection.model.name, modelAttrs.id);
        storedModel.should.eql(modelAttrs);
      });
      storedCollection = this.app.fetcher.collectionStore.get(this.MyCollection.name, collection.params);
      storedCollection.ids.should.eql(_.pluck(models, 'id'));
      storedCollection.meta.should.eql(meta);
    });
  });

  describe("_parseModel", function() {
    it("should set the model's app property during add, reset", function() {
      var MyCollection, collection, models,
        _this = this;

      MyCollection = BaseCollection.extend({});

      models = [{
        id: 1,
        foo: 'bar'
      }, {
        id: 2,
        foo: 'bot'
      }];
      collection = new MyCollection(models, {
        app: this.app
      });
      collection.each(function(model) {
        model.app.should.eql(_this.app);
      });
      collection.reset(models);
      collection.each(function(model) {
        model.app.should.eql(_this.app);
      });
      collection.add({
        id: 3,
        foo: 'bit'
      });
      collection.last().app.should.eql(this.app);
    });
  });
});
