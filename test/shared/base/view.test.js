var should = require('chai').should(),
    sinon = require('sinon'),
    BaseView = require('../../../shared/base/view'),
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
});
