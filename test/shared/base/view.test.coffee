require('../../../shared/globals')
should = require('should')

BaseView = require('../../../shared/base/view')

describe 'BaseView', ->

  beforeEach ->
    class @MyTopView extends BaseView
      name: 'top'

    class @MyBottomView extends BaseView
      name: 'bottom'


  it "should return correct views by name", ->

    topView = new @MyTopView()
    topView.childViews = []

    topView.getChildViewsByName().should.be.empty
    topView.getChildViewsByName('foo').should.be.empty

    bottomView = new @MyBottomView()
    topView.childViews.push(bottomView)

    topView.getChildViewsByName().should.be.empty
    topView.getChildViewsByName('foo').should.be.empty

    childViews = topView.getChildViewsByName('bottom')

    childViews.should.have.length(1)

    (bottomView).should.eql(childViews[0])

    anotherBottomView = new @MyBottomView()
    topView.childViews.push(anotherBottomView)

    childViews = topView.getChildViewsByName('bottom')

    childViews.should.have.length(2)


