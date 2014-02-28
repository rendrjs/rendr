var should = require('chai').should(),
    sinon = require('sinon'),
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
});
