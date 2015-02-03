var chai = require('chai')
    should = chai.should(),
    expect = chai.expect,
    sinon = require('sinon'),
    _ = require('underscore'),
    BaseModel = require('../../../shared/base/model'),
    BaseCollection = require('../../../shared/base/collection'),
    BaseView = require('../../../shared/base/view'),
    Backbone = require('backbone'),
    ModelUtils = require('../../../shared/modelUtils'),
    modelUtils = new ModelUtils();

describe('BaseView', function() {
  beforeEach(function() {
    this.MyTopView = BaseView.extend({});
    this.MyTopView.id = 'MyTopView';

    this.MyBottomView = BaseView.extend({});
    this.MyBottomView.id = 'MyBottomView';
    this.app = {modelUtils: modelUtils};
  });

  it("should return correct views by name", function() {
    var anotherBottomView, bottomView, childViews, topView;

    topView = new this.MyTopView({app: this.app});
    topView.childViews = [];
    topView.getChildViewsByName().should.be.empty;
    topView.getChildViewsByName('foo').should.be.empty;
    bottomView = new this.MyBottomView({app: this.app});
    topView.childViews.push(bottomView);
    topView.getChildViewsByName().should.be.empty;
    topView.getChildViewsByName('foo').should.be.empty;
    childViews = topView.getChildViewsByName('my_bottom_view');
    childViews.should.have.length(1);
    bottomView.should.eql(childViews[0]);
    anotherBottomView = new this.MyBottomView({app: this.app});
    topView.childViews.push(anotherBottomView);
    childViews = topView.getChildViewsByName('my_bottom_view');
    childViews.should.have.length(2);
  });

  describe('constructor', function() {
    var spy, data, view;

    beforeEach(function() {
      spy = sinon.spy(Backbone, 'View');
      data = { app: this.app, el: '#test' };
    });

    afterEach(function() {
      Backbone.View.restore();
    })

    it('does not pass the model if it is set', function() {
      data.model = 'a'
      view = new BaseView(data)

      spy.should.have.been.called
      spy.should.have.been.calledWith(_.omit(data, 'model'))
      view.model.should.equal(data.model)
    });

    it('does not pass the collection if it is set', function() {
      data.collection = 'a'
      view = new BaseView(data)

      spy.should.have.been.called
      spy.should.have.been.calledWith(_.omit(data, 'collection'))
      view.collection.should.equal(data.collection)
    });
  });

  describe('getTemplate', function() {
    beforeEach(function() {
      this.app = {
        templateAdapter: {
          getTemplate: sinon.spy()
        },
        modelUtils: modelUtils
      };

      this.topView = new this.MyTopView({
        app: this.app
      });
    });

    it("should delegate to the app's templateAdapter", function() {
        this.topView.getTemplate();
        this.app.templateAdapter.getTemplate.should.have.been.calledOnce;
    });
  });

  describe('getAttributes', function () {
    beforeEach(function () {
      this.View = BaseView.extend({
        id: 'aViewId',
        className: 'aClassName',
        name: 'A View Name'
      });
    });

    it('should handle view.attributes being non-existant', function () {
      var view = new this.View({app: this.app});

      view.getAttributes().should.deep.equal({
        id: 'aViewId',
        'class': 'aClassName',
        'data-view': 'A View Name'
      });
    });

    it('should handle view.attributes being an object', function () {
      var view = new this.View({app: this.app});

      view.attributes = {
        attribute1: 'value1',
        attribute2: 'value2'
      };

      view.getAttributes().should.deep.equal({
        id: 'aViewId',
        'class': 'aClassName',
        'data-view': 'A View Name',
        attribute1: 'value1',
        attribute2: 'value2'
      });
    });

    it('should handle view.attributes being a function', function () {
      var view = new this.View({app: this.app});

      view.attributes = function () {
        return {
          attribute1: 'value1',
          attribute2: 'value2'
        };
      };

      view.getAttributes().should.deep.equal({
        id: 'aViewId',
        'class': 'aClassName',
        'data-view': 'A View Name',
        attribute1: 'value1',
        attribute2: 'value2'
      });
    });
  });

  describe('parseOptions', function () {
    var view;

    beforeEach(function () {
      this.View = BaseView.extend({
        id: 'aViewId',
        className: 'aClassName',
        name: 'A View Name'
      });

      view = new this.View({app: this.app});
    });

    it('sets the app and parentView on the view object', function () {
      view.app = undefined;
      view.parseOptions({ app: this.app, parentView: 'test' });
      view.app.should.deep.equal(this.app);
      view.parentView.should.equal('test');
    });

    it('should invoke parseModelAndCollection with the parse option', function () {
      var spy = sinon.spy(BaseView, 'parseModelAndCollection');
      view.parseOptions({ app: this.app });
      spy.should.have.been.calledWith(this.app.modelUtils, { app: this.app, parse: true }).once;
      BaseView.parseModelAndCollection.restore()
    });

    it('sets the model and collection to the view instance', function () {
      var MyModel,
          MyColleciton;

      MyModel = BaseModel.extend({});
      MyModel.id = 'MyModel';

      MyCollection = BaseCollection.extend({});
      MyCollection.id = 'MyCollection';

      var myModel = new MyModel(),
          myCollection = new MyCollection();

      var options = {
        model: myModel,
        collection: myCollection
      };

      view.parseOptions(options);
      view.model.should.deep.equal(myModel);
      view.collection.should.deep.equal(myCollection);
    });

    it('adds any extra attributes directly to the views options', function () {
      var options = { app: this.app, test: 'test' };
      view.parseOptions(options);
      view.options.should.deep.equal(options);
    });
  });

  describe('_fetchLazyCallback', function() {
    beforeEach(function() {
      this.app = {
        templateAdapter: {
          getTemplate: sinon.spy()
        },
        modelUtils: modelUtils
      };

      this.topView = new this.MyTopView({
        app: this.app
      });

      this.topView.setLoading = sinon.stub();
      this.topView.render = sinon.spy();
    });

    it("should not call render if the view isn't being viewed", function() {
      this.topView.viewing = false;
      this.topView._fetchLazyCallback(null, {});
      this.topView.render.should.not.have.been.called;
    });

    it("should call render if the view is being viewed", function() {
      this.topView.viewing = true;
      this.topView._fetchLazyCallback(null, {});
      this.topView.render.should.have.been.called;
    });
  });

  describe('parseModelAndCollection', function () {
    context('there is a model', function () {
      var MyModel = BaseModel.extend({}),
          modelData = { id: 101, name: 'test' },
          model;

      MyModel.id = 'MyModel';

      context('is an instance of a model', function () {
        beforeEach(function() {
          model = new MyModel(modelData, { app: this.app });
        });

        it('should add model_name and model_id attributes', function () {
          var result = BaseView.parseModelAndCollection(modelUtils, { model: model });

          result.should.deep.equal({
            model_name: 'my_model',
            model_id: 101,
            model: model
          });
        });
      });

      context('contains data to build model', function () {
        var modelInstance,
            modelUtilsMock;

        beforeEach(function() {
          modelInstance = new MyModel(modelData, { app: this.app });
          modelUtilsMock = sinon.mock(modelUtils);
          modelUtilsMock.expects("getModel").withArgs('MyModel', modelData, { parse: true, app: this.app }).returns(modelInstance);
        });

        afterEach(function() {
          modelUtilsMock.restore();
        });

        it('it should create an instance of the model', function () {
          var result = BaseView.parseModelAndCollection(modelUtils, { model: modelData, model_name: 'MyModel', app: this.app, parse: true });

          result.should.deep.equal({
            model_name: 'MyModel',
            model_id: 101,
            model: modelInstance,
            app: this.app,
            parse: true
          });
        });

        context('options do not contain parse: true', function () {
          it('it should not pass parse: true to modelUtils', function () {
            modelUtilsMock.expects("getModel").withArgs('MyModel', modelData, { parse: false, app: this.app }).returns(modelInstance);
            BaseView.parseModelAndCollection(modelUtils, { model: modelData, model_name: 'MyModel', app: this.app });
          });
        });
      });
    });

    context('there is a collection', function () {
      var MyCollection = BaseCollection.extend({}),
          collection,
          params = { test: 'test' };
      MyCollection.id = 'MyCollection';

      context ('it is an instance of a collection', function () {
        beforeEach(function () {
          collection = new MyCollection([], {
            app: this.app,
            params: params
          });
        });

        it('adds collection_name and collection_params', function () {
          var result = BaseView.parseModelAndCollection(modelUtils, {
            collection: collection
          });

          result.should.deep.equal({
            collection_name: 'my_collection',
            collection_params: { test: 'test' },
            collection: collection
          });
        });
      });

      context('contains an array of model data to build a collection', function () {
        var modelUtilsMock;

        beforeEach(function() {
          collection = new MyCollection([], { app: this.app, params: { test: 'test' } });
          modelUtilsMock = sinon.mock(modelUtils);
          modelUtilsMock.expects("getCollection").withArgs('MyCollection', [], { parse: true, app: this.app, params: params }).returns(collection);
        });

        afterEach(function() {
          modelUtilsMock.restore();
        });

        it('it should create an instance of the collection', function () {
          var result = BaseView.parseModelAndCollection(modelUtils, { collection: [], collection_name: 'MyCollection', app: this.app, collection_params: params, parse: true });

          result.should.deep.equal({
            collection_name: 'MyCollection',
            collection_params: params,
            collection: collection,
            app: this.app,
            parse: true
          });
        });

        context('options do not contain parse: true', function () {
          it('it should not pass parse: true to modelUtils', function () {
            modelUtilsMock.expects("getCollection").withArgs('MyCollection', [], { parse: false, app: this.app, params: params }).returns(collection);
            BaseView.parseModelAndCollection(modelUtils, { collection: [], collection_name: 'MyCollection', app: this.app, collection_params: params });
          });
        });
      });
    });
  });

  describe('extractFetchSummary', function () {
    var MyView,
        MyModel,
        MyCollection,
        fetchSummary;

    beforeEach(function () {
      MyModel = BaseModel.extend({});
      MyModel.id = 'MyModel';

      MyCollection = BaseCollection.extend({});
      MyCollection.id = 'MyCollection';

      MyView = BaseView.extend({});

      fetchSummary = {};
    });

    it('should extract model meta data from view options', function () {
      var myViewInstance,
          myModelInstance,
          expectedFetchSummary;

      myModelInstance = {
        id: 9,
        name: 'Sunny'
      };

      myViewInstance = new MyView({
        app: this.app,
        myModel: new MyModel(myModelInstance, { app: this.app })
      });

      expectedFetchSummary = {
        myModel: {
          model: 'MyModel',
          id: "9"
        }
      };

      fetchSummary = BaseView.extractFetchSummary(modelUtils, myViewInstance.options);
      fetchSummary.should.deep.equal(expectedFetchSummary);
    });

    it('should extract collection meta data from view options', function () {
      var myViewInstance,
          expectedFetchSummary;

      myViewInstance = new MyView({
        app: this.app,
        myCollection: new MyCollection([], { app: this.app, params: { parameter1: 1 }  })
      });

      expectedFetchSummary = {
        myCollection: {
          collection: 'MyCollection',
          params: { parameter1: 1 }
        }
      };

      fetchSummary = BaseView.extractFetchSummary(modelUtils, myViewInstance.options);
      fetchSummary.should.deep.equal(expectedFetchSummary);
    });

    it('should still work with multiple models and collections', function () {
      var myViewInstance,
          myModelInstance,
          expectedFetchSummary;

      myModelInstance = {
        id: 9,
        name: 'Sunny'
      };

      myViewInstance = new MyView({
        app: this.app,
        myModel: new MyModel(myModelInstance, { app: this.app }),
        myOtherModel: new MyModel(myModelInstance, { app: this.app }),
        myCollection: new MyCollection([], { app: this.app, params: { parameter1: 1 }  }),
        myOtherCollection: new MyCollection([], { app: this.app, params: { parameter2: 2 }  })
      });

      expectedFetchSummary = {
        myModel: {
          model: 'MyModel',
          id: "9"
        },
        myOtherModel: {
          model: 'MyModel',
          id: "9"
        },
        myCollection: {
          collection: 'MyCollection',
          params: { parameter1: 1 }
        },
        myOtherCollection: {
          collection: 'MyCollection',
          params: { parameter2: 2 }
        }
      };

      fetchSummary = BaseView.extractFetchSummary(modelUtils, myViewInstance.options);
      fetchSummary.should.deep.equal(expectedFetchSummary);
    });

    it('should ignore the model if its instance has no id set', function () {
      var myViewInstance,
          myModelInstanceWithoutId,
          expectedFetchSummary;

      myModelInstanceWithoutId = {
        name: 'Sunny'
      };

      myViewInstance = new MyView({
        app: this.app,
        myModel: new MyModel(myModelInstanceWithoutId, { app: this.app })
      });

      expectedFetchSummary = {};

      fetchSummary = BaseView.extractFetchSummary(modelUtils, myViewInstance.options);
      fetchSummary.should.deep.equal(expectedFetchSummary);
    });

    it('should ignore non-rendr objects', function () {
      var myViewInstance,
          MyBackboneModel,
          MyBackboneCollection,
          expectedFetchSummary;

      MyBackboneModel = Backbone.Model.extend({});
      MyBackboneCollection = Backbone.Collection.extend({});

      myViewInstance = new MyView({
        app: this.app,
        myBackboneModel: new MyBackboneModel({ id: 1, name: 'Sunny' }, { app: this.app }),
        myBackboneCollection: new MyBackboneCollection({ model: MyBackboneModel }, { app: this.app }),
        myPlainJavaScriptObject: { id: 1, name: 'Sunny' },
        myJavaScriptNumber: 1
      });

      expectedFetchSummary = {};

      fetchSummary = BaseView.extractFetchSummary(modelUtils, myViewInstance.options);
      fetchSummary.should.deep.equal(expectedFetchSummary);
    });
  });

  describe('remove', function () {
    beforeEach(function() {
      this.app = {
        modelUtils: modelUtils,
        router: {
          currentView: null
        }
      };
    });

    it('should remove the reference to this view from its parentView', function () {
      var bottomView, childViews, topView;

      topView = new this.MyTopView({app: this.app});
      topView.childViews = [];
      bottomView = new this.MyBottomView({app: this.app});
      bottomView.$el = $('<div>');
      bottomView.parentView = topView;
      topView.childViews.push(bottomView);
      childViews = topView.getChildViewsByName('my_bottom_view');
      childViews.should.have.length(1);
      bottomView.remove()
      childViews = topView.getChildViewsByName('my_bottom_view');
      childViews.should.be.empty;
    });

    it('should not error when removing the currentView', function () {
      var bottomView, childViews, topView;

      topView = new this.MyTopView({app: this.app});
      this.app.router.currentView = topView
      topView.$el = $('<div>');
      topView.childViews = [];

      expect(topView.remove.bind(topView)).to.not.throw(Error)
    });

  });
});
