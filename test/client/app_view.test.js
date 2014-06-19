var App = require('../../shared/app'),
    AppView = require('../../client/app_view'),
    should = require('chai').should(),
    expect = require('chai').expect,
    clientTestHelper = require('../helpers/client_test'),
    $ = require('jquery');

describe('AppView', function() {
  before(clientTestHelper.before);

  beforeEach(function() {
    this.app = new App();
    this.appView = new AppView({app: this.app});
    this.appView.hasPushState = true;
    window.location = {};
    window.location.pathname = "/page1";
  });

  after(clientTestHelper.after);

  it('should intercept clicks', function(){
    var event = new $.Event('click', {metaKey: false, shiftKey: false});
    var el = $('<a>');
    var actual = this.appView.shouldInterceptClick('/', el, event);
    actual.should.be.true;
  });

  it('should not intercept clicks with the meta key', function(){
    var event = new $.Event('click', {metaKey: true, shiftKey: false});
    var el = $('<a>');
    var actual = this.appView.shouldInterceptClick('/', el, event);
    actual.should.be.false;
  });

  it('should not intercept clicks with the shift key', function(){
    var event = new $.Event('click', {metaKey: false, shiftKey: true});
    var el = $('<a>');
    var actual = this.appView.shouldInterceptClick('/', el, event);
    actual.should.be.false;
  });

  it('should allow contentEl to be set in a child', function(){
    var Child = AppView.extend({ options: { contentEl: '#foo' } });
    var appView = new Child({app: this.app});
    expect( appView.options.contentEl ).to.equal( '#foo' );
  });

});
