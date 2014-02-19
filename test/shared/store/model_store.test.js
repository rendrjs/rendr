var util = require('util'),
    _ = require('underscore'),
    should = require('chai').should(),
    ModelStore = require('../../../shared/store/model_store'),
    BaseModel = require('../../../shared/base/model'),
    ModelUtils = require('../../../shared/modelUtils'),
    modelUtils = new ModelUtils(),
    AddClassMapping = require('../../helpers/add_class_mapping'),
    addClassMapping = new AddClassMapping(modelUtils),
    BaseCollection = require('../../../shared/base/collection');

function MyModel() {
  MyModel.super_.apply(this, arguments);
}
util.inherits(MyModel, BaseModel);

function MyCollection() {
  MyCollection.super_.apply(this, arguments);
}
util.inherits(MyCollection, BaseCollection);

function App() {}

addClassMapping.add(modelUtils.resourceName(MyModel), MyModel);

describe('ModelStore', function() {
  beforeEach(function() {
    this.app = new App({modelUtils: modelUtils});
    this.store = new ModelStore({
      app: this.app,
      modelUtils: modelUtils
    });
  });

  it("should get and set the values for a model", function() {
    var model, modelAttrs, result;

    modelAttrs = {
      foo: 'bar',
      id: 1
    };
    model = new MyModel(modelAttrs);
    this.store.set(model);
    result = this.store.get('my_model', 1);
    result.should.eql(modelAttrs);
  });

  it("should support custom idAttribute", function() {
    var model, modelAttrs, result;

    modelAttrs = {
      foo: 'bar',
      login: 'homeslice'
    };

    function MyCustomModel() {
      MyCustomModel.super_.apply(this, arguments);
    }
    util.inherits(MyCustomModel, BaseModel);

    MyCustomModel.prototype.idAttribute = 'login';

    model = new MyCustomModel(modelAttrs);
    this.store.set(model);
    result = this.store.get(modelUtils.resourceName(MyCustomModel), modelAttrs.login);
    result.should.eql(modelAttrs);
  });

  it("should support returning a model instance", function() {
    var model, modelAttrs, resultModel;

    modelAttrs = {
      foo: 'bar',
      id: 1
    };
    model = new MyModel(modelAttrs);
    this.store.set(model);
    resultModel = this.store.get('my_model', 1, true);
    resultModel.should.be.an.instanceOf(BaseModel);
    resultModel.toJSON().should.eql(modelAttrs);
    resultModel.app.should.eql(this.app);
  });

  it("should merge model attrs when setting", function() {
    var finalModelAttrs, firstModelAttrs, model, result, secondModelAttrs;

    firstModelAttrs = {
      foo: 'bar',
      id: 1
    };
    secondModelAttrs = {
      bam: 'baz',
      id: 1
    };
    finalModelAttrs = _.extend({}, firstModelAttrs, secondModelAttrs);
    model = new MyModel(firstModelAttrs);
    this.store.set(model);
    model = new MyModel(secondModelAttrs);
    this.store.set(model);
    result = this.store.get('my_model', 1);
    result.should.eql(finalModelAttrs);
  });
  describe('find', function(){
    function MySecondModel() {
      MySecondModel.super_.apply(this, arguments);
    }
    util.inherits(MySecondModel, BaseModel);

    addClassMapping.add(modelUtils.resourceName(MySecondModel), MySecondModel);

    it('should find a model on custom attributes', function(){
      var model, modelAttrs, result;
      modelAttrs = {
        foo: 'bar',
        id: 1
      };
      model = new MyModel(modelAttrs);
      this.store.set(model);
      result = this.store.find('my_model', {foo: 'bar'});
      result.should.eql(modelAttrs);
    });

    it('should skip different models, even when they match the query', function(){
      var model, modelAttrs, result;
      modelAttrs = {
        foo: 'bar',
        id: 1
      };
      model = new MySecondModel(modelAttrs);
      this.store.set(model);
      result = this.store.find('my_model', {foo: 'bar'});
      should.equal(result, undefined);
    });
  });

  it("should support storing models without an id if they are in a collection", function() {
    var collection, model, collectionAttrs, modelAttrs, resultModel;
    collectionAttrs = {
      id: 'my_collection'
    };
    collection = new MyCollection(collectionAttrs);
    modelAttrs = {
      id : 1,
      foo : 'bar'
    };
    model = new BaseModel(modelAttrs);
    model.collection = collection;
    this.store.set(model);
    resultModel = this.store.get('my_collection', 1);
    resultModel.should.eql(modelAttrs);
  });

  it("should return and instance of BaseModel if a model doesn't have an id and is in a collection", function() {
    var collection, model, collectionAttrs, modelAttrs, resultModel;
    collectionAttrs = {
      id: 'my_collection'
    };
    collection = new MyCollection(collectionAttrs);
    modelAttrs = {
      id : 1,
      foo : 'bar'
    };
    model = new BaseModel(modelAttrs);
    model.collection = collection;
    this.store.set(model);
    resultModel = this.store.get('my_collection', 1, true);
    resultModel.should.be.an.instanceOf(BaseModel);
    resultModel.toJSON().should.eql(modelAttrs);
    resultModel.app.should.eql(this.app);
  });

});
