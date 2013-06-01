var BaseView, should;

should = require('should');
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

  describe('getViewNamePermutations', function() {
    it('should return multiple view/template directory options', function() {
        var conditionsIndex = 'conditions_index_view';
            conditionsViewOpts = [
                'conditions_index_view',
                'conditions/index',
                'conditions/index_view'
            ],
            fooShow = 'foo_show',
            fooShowViewOpts = [
                'foo_show',
                'foo/show'
            ],
            coolFeatureIndex = 'my_cool_feature_index_view',
            coolFeatureViewOpts = [
                'my_cool_feature_index_view',
                'my_cool_feature/index',
                'my_cool_feature/index_view',
                'my/cool/feature/index',
                'my/cool/feature/index_view'
            ];

        BaseView.getViewNamePermutations(conditionsIndex).should.eql(conditionsViewOpts);
        BaseView.getViewNamePermutations(fooShow).should.eql(fooShowViewOpts);
        BaseView.getViewNamePermutations(coolFeatureIndex).should.eql(coolFeatureViewOpts);
    });
  });

  describe('safeGet', function() {
    it('should return the correct value', function() {
        BaseView.safeGet('some_view_name', function(v){ return v;}).should.eql('some_view_name');
        BaseView.safeGet('some_view_name', function(v){ return v;}, 'PRE_').should.eql('PRE_some_view_name');
    });
    it('should fail silently', function() {
        should.not.exist( BaseView.safeGet('a_string', function(v) { return v.join(); }) );
    });
  });

});
