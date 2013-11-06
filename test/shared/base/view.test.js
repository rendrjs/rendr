var BaseView, should, sinon;

should = require('chai').should();
sinon = require('sinon');
BaseView = require('../../../shared/base/view');

describe('BaseView', function() {
  beforeEach(function() {
    this.MyTopView = BaseView.extend({});
    this.MyTopView.id = 'MyTopView';

    this.MyBottomView = BaseView.extend({});
    this.MyBottomView.id = 'MyBottomView';
  });

  it("should return correct views by name", function() {
    var anotherBottomView, bottomView, childViews, topView;

    topView = new this.MyTopView();
    topView.childViews = [];
    topView.getChildViewsByName().should.be.empty;
    topView.getChildViewsByName('foo').should.be.empty;
    bottomView = new this.MyBottomView();
    topView.childViews.push(bottomView);
    topView.getChildViewsByName().should.be.empty;
    topView.getChildViewsByName('foo').should.be.empty;
    childViews = topView.getChildViewsByName('my_bottom_view');
    childViews.should.have.length(1);
    bottomView.should.eql(childViews[0]);
    anotherBottomView = new this.MyBottomView();
    topView.childViews.push(anotherBottomView);
    childViews = topView.getChildViewsByName('my_bottom_view');
    childViews.should.have.length(2);
  });

  describe('getTemplate', function() {
    beforeEach(function() {
      this.app = {
        templateAdapter: {
          getTemplate: sinon.spy()
        }
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

  describe('getTemplateData', function () {

    it('returns its model', function () {
      var model =  { foo: 'bar' },
          view = new BaseView({ model: model });

      view.getTemplateData().should.deep.equal(model);
    });

    it('returns its collection as models', function () {
      var collection = { models: [ {foo: 1} ] },
          view = new BaseView({ collection: collection});

      view.getTemplateData().should.deep.equal({ models: collection });
    });

    it('returns options if there is neither model nor collection', function () {
      var options = { options: 1 },
          view = new BaseView( options );

      view.getTemplateData().should.deep.equal(options);
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
      var view = new this.View();

      view.getAttributes().should.deep.equal({
        id: 'aViewId',
        'class': 'aClassName',
        'data-view': 'A View Name'
      });
    });

    it('should handle view.attributes being an object', function () {
      var view = new this.View();

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
      var view = new this.View();

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
        }
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
