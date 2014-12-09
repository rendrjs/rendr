var util = require('util'),
    _ = require('underscore'),
    should = require('chai').should(),
    sinon = require('sinon'),
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

function MyModel2() {
  MyModel2.super_.apply(this, arguments);
}
util.inherits(MyModel2, BaseModel);

function App() {}

addClassMapping.add(modelUtils.modelName(MyModel), MyModel);

describe('ModelStore', function() {
  var model, result;
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
    sinon.spy(model, 'parse');

    this.store.set(model);
    result = this.store.get('my_model', 1);

    result.should.eql(model);
    model.parse.should.have.been.called;
    model.parse.restore();
  });

  it("should support custom idAttribute", function() {
    var modelAttrs;

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
    result.should.eql(model);
  });

  context("there is a model with id", function () {
    var defaultModelAttrs;

    beforeEach(function() {
      defaultModelAttrs = {
        foo: 'bar',
        id: 1
      };      

      model = new MyModel(defaultModelAttrs, { app: this.app });
    });

    it("should get and set the values for a model", function() {
      var resultModel;

      this.store.set(model);
      resultModel = this.store.get('my_model', defaultModelAttrs.id);
      resultModel.should.eql(model);
    });

    it("should support returning a model instance", function() {
      var resultModel;

      this.store.set(model);
      resultModel = this.store.get('my_model', defaultModelAttrs.id, true);
      resultModel.should.be.an.instanceOf(BaseModel);
      resultModel.toJSON().should.eql(defaultModelAttrs);
      resultModel.app.should.eql(this.app);
      resultModel.should.be.equal(model);
    });

    it("should be able to be cleared from the store by id", function() {
      var resultModel;
     
      this.store.set(model);
      resultModel = this.store.get('my_model', defaultModelAttrs.id, true);
      should.exist(resultModel);
      this.store.clear('my_model', defaultModelAttrs.id);
      resultModel = this.store.get('my_model', defaultModelAttrs.id, true);
      should.not.exist(resultModel);
    });  

    describe('find', function(){
      function MySecondModel() {
        MySecondModel.super_.apply(this, arguments);
      }
      util.inherits(MySecondModel, BaseModel);

      addClassMapping.add(modelUtils.modelName(MySecondModel), MySecondModel);

      it('should find a model on custom attributes', function(){
        this.store.set(model);
        resultModel = this.store.find('my_model', {foo: 'bar'});
        resultModel.should.eql(model);
      });

      it('should skip different models, even when they match the query', function(){       
        model = new MySecondModel(defaultModelAttrs);
        this.store.set(model);
        resultModel = this.store.find('my_model', {foo: 'bar'});
        should.equal(resultModel, undefined);
      });    
    });
    context("more than one model", function () {
      var defaultModelAttrs2, model2;

      beforeEach(function() {
        defaultModelAttrs2 = {
          foo: 'bar2',
          id: 2
        };
        model2 = new MyModel(defaultModelAttrs2, { app: this.app });
      });

      it("all should be able to be cleared from the store", function() {

        this.store.set(model);
        this.store.set(model2);

        resultModel = this.store.get('my_model', defaultModelAttrs.id, true);
        should.exist(resultModel);
        resultModel = this.store.get('my_model', defaultModelAttrs2.id, true);
        should.exist(resultModel);
        this.store.clear();
        resultModel = this.store.get('my_model', defaultModelAttrs.id, true);
        should.not.exist(resultModel);
        resultModel = this.store.get('my_model', defaultModelAttrs2.id, true);    
        should.not.exist(resultModel);
      });          
    });
    context("more than one type of model", function () {
      var defaultModelAttrs2, model2;

      beforeEach(function() {
        defaultModelAttrs2 = {
          foo: 'bar2',
          id: 2
        };
        model2 = new MyModel2(defaultModelAttrs2, { app: this.app });
      });

      it("should be able to be clear one full model from the store", function() {

        this.store.set(model);
        this.store.set(model2);

        resultModel = this.store.get('my_model', defaultModelAttrs.id, true);
        should.exist(resultModel);
        resultModel = this.store.get('my_model2', defaultModelAttrs2.id, true);
        should.exist(resultModel);

        this.store.clear('my_model');
        resultModel = this.store.get('my_model', defaultModelAttrs.id, true);
        should.not.exist(resultModel);
        resultModel = this.store.get('my_model2', defaultModelAttrs2.id, true);    
        should.exist(resultModel);
      });
    });
  });
});
