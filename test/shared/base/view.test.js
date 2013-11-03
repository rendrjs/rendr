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
