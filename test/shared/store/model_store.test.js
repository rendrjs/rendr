var util = require('util'),
    _ = require('underscore'),
    should = require('chai').should(),
    ModelStore = require('../../../shared/store/model_store'),
    BaseModel = require('../../../shared/base/model'),
    ModelUtils = require('../../../shared/modelUtils'),
    modelUtils = new ModelUtils(),
    AddClassMapping = require('../../helpers/add_class_mapping'),
    addClassMapping = new AddClassMapping(modelUtils);

function MyModel() {
  MyModel.super_.apply(this, arguments);
}
util.inherits(MyModel, BaseModel);

function App() {}

addClassMapping.add(modelUtils.modelName(MyModel), MyModel);

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
    result = this.store.get(modelUtils.modelName(MyCustomModel), modelAttrs.login);
    result.should.eql(modelAttrs);
  });

  it("should support returning a model instance", function() {
    var model, modelAttrs, resultModel;

    modelAttrs = {
      foo: 'bar',
      id: 1
    };
    model = new MyModel(modelAttrs, {app: this.app});
    this.store.set(model);
    resultModel = this.store.get('my_model', 1, true);
    resultModel.should.be.an.instanceOf(BaseModel);
    resultModel.toJSON().should.eql(modelAttrs);
    resultModel.app.should.eql(this.app);
    resultModel.should.be.equal(model);
  });

  it("should allow clearing out of the store by id", function() {
    var model, modelAttrs, resultModel;

    modelAttrs = {
      foo: 'foo',
      id: 1
    };
    
    model = new MyModel(modelAttrs, {app: this.app});
    this.store.set(model);
    resultModel = this.store.get('my_model', 1, true);
    should.exist(resultModel);
    this.store.clear(modelAttrs.id);
    resultModel = this.store.get('my_model', 1, true);
    should.not.exist(resultModel);
  });  

  it("should allow clearing out the store", function() {
      var model, modelAttrs, resultModel;

    modelAttrs = {
      foo: 'foo',
      id: 1
    };
    modelAttrs2 = {
      foo: 'bar',
      id: 2
    };
    
    model = new MyModel(modelAttrs, {app: this.app});
    this.store.set(model);
    model = new MyModel(modelAttrs2, {app: this.app});
    this.store.set(model);

    resultModel = this.store.get('my_model', 1, true);
    should.exist(resultModel);
    resultModel = this.store.get('my_model', 2, true);
    should.exist(resultModel);
    this.store.clear();
    resultModel = this.store.get('my_model', 1, true);
    should.not.exist(resultModel);
    resultModel = this.store.get('my_model', 2, true);    
    should.not.exist(resultModel);
  });    

  describe('find', function(){
    function MySecondModel() {
      MySecondModel.super_.apply(this, arguments);
    }
    util.inherits(MySecondModel, BaseModel);

    addClassMapping.add(modelUtils.modelName(MySecondModel), MySecondModel);

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
});
