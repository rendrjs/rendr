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
    modelUtils = new ModelUtils(),
    window = require('jsdom').jsdom().parentWindow,
    $ = require('jquery')(window);

Backbone.$ = $;

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

    context('has lazyErrorCallback', function () {
      beforeEach(function() {
        sinon.spy(this.topView, 'lazyErrorCallback');
      });

      afterEach(function () {
        this.topView.lazyErrorCallback.restore();
      });

      it('should invoke the callback when there is an error', function () {
        var err = { err: true };
        this.topView._fetchLazyCallback(err, {});
        expect(this.topView.lazyErrorCallback).to.have.been.calledWith(err);
      });

      it('should not invoke the callback if there is not an error', function () {
        this.topView._fetchLazyCallback(undefined, {});
        expect(this.topView.lazyErrorCallback).to.not.have.been.called;
      });
    });

    context('has lazyCallback', function () {
      beforeEach(function() {
        sinon.spy(this.topView, 'lazyCallback');
        this.topView.viewing = true;
      });

      afterEach(function () {
        this.topView.lazyCallback.restore();
      });

      it('should not invoke the callback if there is an error', function () {
        var err = { err: true };
        this.topView._fetchLazyCallback(err, {});
        expect(this.topView.lazyCallback).to.not.have.been.called;
      });

      it('should not invoke the callback if there is not an error', function () {
        var results = { test: true };
        this.topView._fetchLazyCallback(undefined, results);
        expect(this.topView.lazyCallback).to.have.been.calledWith(results);
      });

      it('should not call the callback if the view is not being viewed', function () {
        this.topView.viewing = false;
        this.topView._fetchLazyCallback(undefined, {});
        expect(this.topView.lazyCallback).to.not.have.been.called;
      });
    });
  });

  describe('fetchLazy', function () {
    beforeEach(function () {
      this.app = {
        fetch: sinon.spy(),
        modelUtils: modelUtils
      };

      this.view = new this.MyTopView({ app: this.app });
      sinon.stub(this.view, 'setLoading');
    });

    context('passed a fetch_spec', function () {
      var fetchSpec;

      beforeEach(function () {
        fetchSpec = {
          model: {
            model: 'Test',
            params: { id: 1 }
          }
        };

        this.view.options.fetch_spec = fetchSpec;
      });

      it('overrides the fetchSpec and calls fetch with it.', function () {
        this.view.fetchLazy();
        expect(this.app.fetch).to.have.been.calledWith(fetchSpec);
      });
    });

    context('passed fetch options', function () {
      var fetchParams, fetchOptions;

      beforeEach(function () {
        fetchParams = { id: 1 };
        fetchOptions = {
          readFromCache: false,
          writeToCache: true
        };

        this.view.options.model_name = 'MyModel';
        this.view.options.fetch_params = fetchParams;
        this.view.options.fetch_options = fetchOptions;
      })

      it('invokes app.fetch with the fetchOptions', function () {
        this.view.fetchLazy();

        expect(this.app.fetch).to.have.been.calledWith({
          model: {
            model: 'MyModel',
            params: fetchParams
          }
        }, fetchOptions);
      });
    });
  });

  describe('_postRender', function() {
    beforeEach(function() {
      this.app = {
        modelUtils: modelUtils
      };

      this.topView = new this.MyTopView({
        app: this.app
      });
    });

    it('should call attachChildViews with a callback function', function() {
      var spy = sinon.spy(this.topView, 'attachChildViews');
      this.topView._postRender();
      var firstArgumentOnFirstCall = spy.args[0][0];
      expect(typeof firstArgumentOnFirstCall).to.be.deep.equal('function');
    });

    it('should call postRender', function() {
      var spy = sinon.spy(this.topView, 'postRender');
      this.topView._postRender();
      expect(spy).to.be.called;
    });

    it("should trigger 'postRender' event", function() {
      var spy = sinon.spy(this.topView, 'trigger');
      this.topView._postRender();
      expect(spy).to.be.calledWith('postRender');
    });
  });

  describe('attachChildViews', function() {
    beforeEach(function() {
      this.app = {
        modelUtils: modelUtils
      };

      this.topView = new this.MyTopView({
        app: this.app
      });

      this.callback = sinon.spy();
    });

    it('should call removeChildViews', function() {
      var spy = sinon.spy(this.topView, 'removeChildViews');
      this.topView.attachChildViews(this.callback);
      spy.should.have.been.called;
    });

    it('should call BaseView.getChildViews with this and this.app params', function() {
      var spy = sinon.spy(BaseView, 'getChildViews');
      this.topView.attachChildViews(this.callback);
      spy.should.have.been.calledWith(this.topView.app, this.topView);
      BaseView.getChildViews.restore();
    });

    it('should call BaseView.getChildViews with a callback function as third param', function() {
      var spy = sinon.spy(BaseView, 'getChildViews');
      this.topView.attachChildViews(this.callback);
      var thirdArgumentOnFirstCall = spy.args[0][2];
      expect(typeof thirdArgumentOnFirstCall).to.be.deep.equal('function');
      BaseView.getChildViews.restore();
    });

    it('should set the chieldViews array with the given views', function() {
      var myGetChildViews = function(arg1, arg2, callback) {
        callback(['foo', 'bar']);
      };
      sinon.stub(BaseView, 'getChildViews', myGetChildViews);

      this.topView.attachChildViews(this.callback);
      expect(this.topView.childViews).to.be.deep.equal(['foo', 'bar']);
      BaseView.getChildViews.restore();
    });

    it('should call the provided callback with the correct context', function() {
      this.topView.attachChildViews(this.callback);
      this.callback.should.have.been.calledOn(this.topView);
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
        router: { currentView: null }
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
      bottomView.remove();
      childViews = topView.getChildViewsByName('my_bottom_view');
      childViews.should.be.empty;
    });

    it('should not error when removing the currentView', function () {
      var bottomView, childViews, topView;

      topView = new this.MyTopView({app: this.app});
      this.app.router.currentView = topView
      topView.$el = $('<div>');
      topView.childViews = [];

      expect(topView.remove.bind(topView)).to.not.throw(Error);
    });

  });

  describe('createChildView', function() {
    var ViewClass, parentView, cb, attachNewChildView;

    beforeEach(function() {
      ViewClass = BaseView.extend({});
      parentView = 'parentView';
      cb = sinon.spy();

      sinon.stub(BaseView, 'attachNewChildView').returns('view');
    });

    afterEach(function() {
      BaseView.attachNewChildView.restore();
      cb = null;
    });

    it('should call callback with null and view arguments if the view is not yet attached', function() {
      var $el = $('<div>');

      BaseView.createChildView(ViewClass, {app: this.app}, $el, parentView, cb);
      cb.should.have.been.calledWithExactly(null, 'view');
    });

    it('should call callback with null and null arguments if the view is already attached', function() {
      var $el = $('<div data-view-attached="true"></div>');

      BaseView.createChildView(ViewClass, {app: this.app}, $el, parentView, cb);
      cb.should.have.been.calledWithExactly(null, null);
    });
  });

  describe('attachNewChildView', function() {
    var ViewClass, baseView;

    beforeEach(function() {
      baseView = new BaseView({app: this.app});

      ViewClass = this.MyTopView;
      sinon.stub(baseView, 'attachOrRender');
    });

    afterEach(function() {
      baseView.attachOrRender.restore();
    });

    it('should create a new instance of ViewClass', function() {
      var newChildView = BaseView.attachNewChildView(ViewClass, {app: this.app}, 'foo', 'bar');

      expect(newChildView).to.be.an.instanceOf(ViewClass);
    });
  });

  describe('BaseView.getViewOptions', function() {
    it('should not unescape escaped data', function() {
      var fakeEl = {
        data: _.constant({
          normalOption: 'Normal data',
          jsonOption: '{"json":"data"}',
          escapedOption: 'I am &lt;span&gt;escaped&lt;/span&gt;',
          escapedJsonOption: '{"escapedData":"I am &lt;span&gt;escaped&lt;/span&gt;"}'
        })
      }

      var parsedOptions = BaseView.getViewOptions(fakeEl);

      expect(parsedOptions).to.deep.equal({
        normalOption: 'Normal data',
        jsonOption: {json: 'data'},
        escapedOption: 'I am &lt;span&gt;escaped&lt;/span&gt;',
        escapedJsonOption: {escapedData: 'I am &lt;span&gt;escaped&lt;/span&gt;'}
      });
    });
  });
});
