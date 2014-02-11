var chai = require('chai'),
  should = chai.should(),
  sinon = require('sinon'),
  sinonChai = require('sinon-chai'),
  ModelUtils = require('../../shared/modelUtils'),
  BaseModel = require('../../shared/base/model'),
  BaseCollection = require('../../shared/base/collection');

chai.use(sinonChai);

describe('modelUtils', function () {
  var entryPath = '/some/entry/path/',
    modelUtils,
    ExtendedModel = BaseModel.extend({ idAttribute: 'idAttr' });

  beforeEach(function () {
    modelUtils = new ModelUtils(entryPath);
  });

  describe('getModel', function () {
    var modelName = 'SomeModel',
      attributes = { some: 'attributes' },
      options = { some: 'options' };

    it('should return the model instance with the default attributes and options', function () {
      var modelInstance;

      sinon.stub(modelUtils, 'getModelConstructor').returns(ExtendedModel);

      modelInstance = modelUtils.getModel(modelName);

      modelInstance.should.be.an.instanceOf(ExtendedModel);
      modelInstance.attributes.should.deep.equal({});
      modelInstance.options.should.deep.equal({});
      modelUtils.getModelConstructor.should.have.been.calledWith(modelName);
    });

    it('should return the model instance', function () {
      var modelInstance;

      sinon.stub(modelUtils, 'getModelConstructor').returns(ExtendedModel);

      modelInstance = modelUtils.getModel(modelName, attributes, options);

      modelInstance.should.be.an.instanceOf(ExtendedModel);
      modelInstance.attributes.should.deep.equal(attributes);
      modelInstance.options.should.deep.equal(options);
      modelUtils.getModelConstructor.should.have.been.calledWith(modelName);
    });

    it('should call the callback with the model instance', function () {
      sinon.stub(modelUtils, 'getModelConstructor').yields(ExtendedModel);

      modelUtils.getModel(modelName, attributes, options, function (modelInstance) {
        modelInstance.should.be.an.instanceOf(ExtendedModel);
        modelInstance.attributes.should.deep.equal(attributes);
        modelInstance.options.should.deep.equal(options);
        modelUtils.getModelConstructor.should.have.been.calledWith(modelName);
      });
    });
  });

  describe('getCollection', function () {
    var collectionName = 'SomeCollection',
      Collection = BaseCollection.extend({ model: ExtendedModel }),
      models = [ { idAttr: 1 }, { idAttr: 2 } ],
      options = { some: 'options' };

    it('should return an empty collection instance by default', function () {
      var collectionInstance;

      sinon.stub(modelUtils, 'getCollectionConstructor').returns(Collection);

      collectionInstance = modelUtils.getCollection(collectionName);

      collectionInstance.should.be.an.instanceOf(Collection);
      collectionInstance.models.should.deep.equal([]);
      collectionInstance.options.should.deep.equal({});
      modelUtils.getCollectionConstructor.should.have.been.calledWith(collectionName);
    });

    it('should return the collection instance', function () {
      var collectionInstance;

      sinon.stub(modelUtils, 'getCollectionConstructor').returns(Collection);

      collectionInstance = modelUtils.getCollection(collectionName, models, options);

      collectionInstance.should.be.a.instanceOf(Collection);
      collectionInstance.models[0].should.be.an.instanceOf(ExtendedModel);
      collectionInstance.models[0].attributes.should.deep.equal(models[0]);
      collectionInstance.models[1].should.be.an.instanceOf(ExtendedModel);
      collectionInstance.models[1].attributes.should.deep.equal(models[1]);
      collectionInstance.options.should.deep.equal(options);
      modelUtils.getCollectionConstructor.should.have.been.calledWith(collectionName);
    });

    it('should call the callback with the model instance', function () {
      sinon.stub(modelUtils, 'getCollectionConstructor').yields(Collection);

      modelUtils.getCollection(collectionName, models, options, function (collectionInstance) {
        collectionInstance.should.be.a.instanceOf(Collection);
        collectionInstance.models[0].should.be.an.instanceOf(ExtendedModel);
        collectionInstance.models[0].attributes.should.deep.equal(models[0]);
        collectionInstance.models[1].should.be.an.instanceOf(ExtendedModel);
        collectionInstance.models[1].attributes.should.deep.equal(models[1]);
        collectionInstance.options.should.deep.equal(options);
        modelUtils.getCollectionConstructor.should.have.been.calledWith(collectionName);
      });
    });
  });

  describe('getModelConstructor', function () {
    var modelName = 'SomeModel';
    it('should call fetchConstructor to fetch the model constructor', function () {
      var callback = function () {};
      modelUtils.fetchConstructor = sinon.spy();
      modelUtils.getModelConstructor(modelName, callback);

      modelUtils.fetchConstructor.should.have.been.calledOnce;
      modelUtils.fetchConstructor.should.have.been.calledWith('model', modelName, callback);
    });
  });

  describe('getCollectionConstructor', function () {
    var collectionName = 'SomeCollection';
    it('should call fetchConstructor to fetch the collection constructor', function () {
      var callback = function () {};
      modelUtils.fetchConstructor = sinon.spy();
      modelUtils.getCollectionConstructor(collectionName, callback);

      modelUtils.fetchConstructor.should.have.been.calledOnce;
      modelUtils.fetchConstructor.should.have.been.calledWith('collection', collectionName, callback);
    });
  });

  describe('getFullPath', function () {
    it('should assemble the path for a model correctly', function () {
      modelUtils.getFullPath('model', 'model_name').should.equal('/some/entry/path/app/models/model_name');
    });

    it('should assemble the path for a collection correctly', function () {
      modelUtils.getFullPath('collection', 'collection_name').should.equal('/some/entry/path/app/collections/collection_name');
    });
  });

  describe('fetchConstructor', function () {
    var Constructor = function () {};

    beforeEach(function () {
      sinon.stub(modelUtils, '_require').returns(Constructor);
      sinon.stub(modelUtils, '_requireAMD').yieldsAsync(Constructor);
    });

    it('should return a model constructor', function () {
      modelUtils.fetchConstructor('model', 'ModelName').should.equal(Constructor);
      modelUtils._require.should.have.been.calledOnce;
      modelUtils._require.should.have.been.calledWith('/some/entry/path/app/models/model_name');
    });

    it('should call the callback with a model constructor', function (done) {
      modelUtils.fetchConstructor('model', 'ModelName', function (Model) {
        Model.should.equal(Constructor);
        modelUtils._require.should.have.been.calledOnce;
        modelUtils._require.should.have.been.calledWith('/some/entry/path/app/models/model_name');
        done();
      });
    });

    it('should return a model or collection constructor from the class map', function () {
      modelUtils._classMap['model_name'] = Constructor;
      modelUtils.fetchConstructor('model', 'ModelName').should.equal(Constructor);
      modelUtils._require.should.not.have.been.called;
    });

    it('should call the callback with a model or collection constructor from the class map', function (done) {
      modelUtils._classMap['model_name'] = Constructor;
      modelUtils.fetchConstructor('model', 'ModelName', function (Model) {
        Model.should.equal(Constructor);
        modelUtils._require.should.not.have.been.called;
        done();
      });
    });

    it('should return a collection constructor', function () {
      modelUtils.fetchConstructor('collection', 'CollectionName').should.equal(Constructor);
      modelUtils._require.should.have.been.calledOnce;
      modelUtils._require.should.have.been.calledWith('/some/entry/path/app/collections/collection_name');
    });

    it('should call the callback with a collection constructor', function (done) {
      modelUtils.fetchConstructor('collection', 'CollectionName', function (Collection) {
        Collection.should.equal(Constructor);
        modelUtils._require.should.have.been.calledOnce;
        modelUtils._require.should.have.been.calledWith('/some/entry/path/app/collections/collection_name');
        done();
      });
    });

    describe('in AMD environment', function () {
      before(function () {
        global.define = function () {};
      });

      after(function () {
        delete global.define;
      });

      it('should do an async require for the model', function (done) {
        modelUtils.fetchConstructor('model', 'ModelName', function (Model) {
          Model.should.equal(Constructor);
          modelUtils._requireAMD.should.have.been.calledOnce;
          modelUtils._requireAMD.should.have.been.calledWith([ '/some/entry/path/app/models/model_name' ]);
          done();
        });
      });

      it('should do an async require for the collection', function (done) {
        modelUtils.fetchConstructor('collection', 'CollectionName', function (Collection) {
          Collection.should.equal(Constructor);
          modelUtils._requireAMD.should.have.been.calledOnce;
          modelUtils._requireAMD.should.have.been.calledWith([ '/some/entry/path/app/collections/collection_name' ]);
          done();
        });
      });
    });
  });

  describe('isModel', function () {
    [
      { Constructor: function () {}, expected: false, description: 'any other instance' },
      { Constructor: BaseCollection, expected: false, description: 'a collection' },
      { Constructor: BaseModel, expected: true, description: 'an instance of BaseModel' },
      { Constructor: BaseModel.extend({}), expected: true, description: 'an instance extending from BaseModel' }
    ].forEach(function (testCase) {
        it('should return ' + testCase.expected + ' for ' + testCase.description, function () {
          modelUtils.isModel(new testCase.Constructor()).should.equal(testCase.expected);
        });
      });
  });

  describe('isCollection', function () {
    [
      { Constructor: function () {}, expected: false, description: 'any other instance' },
      { Constructor: BaseModel, expected: false, description: 'a model' },
      { Constructor: BaseCollection, expected: true, description: 'an instance of BaseCollection' },
      { Constructor: BaseCollection.extend({}), expected: true, description: 'an instance extending from BaseCollection' }
    ].forEach(function (testCase) {
        it('should return ' + testCase.expected + ' for ' + testCase.description, function () {
          modelUtils.isCollection(new testCase.Constructor()).should.equal(testCase.expected);
        });
    });
  });

  describe('getModelNameForCollectionName', function () {
    var ModelConstructor = function ModelName() {},
      CollectionConstructor = function CollectionName() {};

    CollectionConstructor.prototype.model = ModelConstructor;

    beforeEach(function () {
      sinon.stub(modelUtils, 'getCollectionConstructor').withArgs('CollectionName').returns(CollectionConstructor);
    });

    it('should return the model name for a collection name', function () {
      modelUtils.getModelNameForCollectionName('CollectionName').should.equal('model_name')
    });
  });

  describe('underscorize', function () {
    [
      { name: undefined, expected: undefined },
      { name: null, expected: undefined },
      { name: 'ModelName', expected: 'model_name' },
      { name: 'modelName', expected: 'model_name' }
    ].forEach(function (testCase) {
      it('should return ' + testCase.expected + ' for model name ' + testCase.name, function () {
        should.equal(modelUtils.underscorize(testCase.name), testCase.expected);
      });
    });
  });

  describe('modelName', function () {
    var ModelConstructor;

    beforeEach(function () {
      ModelConstructor = function ModelName() {};
    });

    it('should return the underscorized model id if it is set', function () {
      ModelConstructor.id = 'modelId';
      modelUtils.modelName(ModelConstructor).should.equal('model_id');
    });

    it('should return the underscorized constructor name if the id is not set', function () {
      modelUtils.modelName(ModelConstructor).should.equal('model_name');
    });
  });

  describe('modelIdAttribute', function () {
    var modelName = 'SomeModel',
      expectedIdAttribute = 'someAttribute',
      ModelConstructor;

    beforeEach(function () {
      ModelConstructor = function () {};
      ModelConstructor.prototype.idAttribute = expectedIdAttribute;

      sinon.stub(modelUtils, 'getModelConstructor').yieldsAsync(ModelConstructor);
    });

    it('should return the idAttribute of the specified model', function (done) {
      modelUtils.modelIdAttribute(modelName, function (idAttribute) {
        idAttribute.should.equal(expectedIdAttribute);

        modelUtils.getModelConstructor.should.have.been.calledOnce;
        modelUtils.getModelConstructor.should.have.been.calledWith(modelName);

        done();
      });
    });
  });
});
