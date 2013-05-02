var viewEngine, BaseView, should, sinon;

should = require('should');
sinon = require('sinon');
require('../../shared/globals');
viewEngine = require('../../server/viewEngine');
BaseView = require('../../shared/base/view');

describe('viewEngine', function() {
  var app;

  beforeEach(function() {
    var View, layoutTemplate;

    layoutTemplate = function(locals) {
      return '<body>'+locals.body+'</body>';
    };
    View = function() {
      return {
        getHtml: sinon.stub().returns('contents')
      };
    };
    sinon.stub(BaseView, 'getView').returns(View);
    app = {
      layoutFinder: {
        getTemplate: sinon.stub().yields(null, layoutTemplate)
      },
      toJSON: sinon.stub()
    };
  });

  afterEach(function() {
    BaseView.getView.restore();
  });

  it("should lookup the layout template via to the app's layoutFinder", function(done) {
    viewEngine('name', {app: app}, function () {
      app.layoutFinder.getTemplate.called.should.be.true;
      done();
    });
  });

  it("should pass the rendered view template to the layout template", function(done) {
    viewEngine('name', {app: app}, function (err, html) {
      html.should.equal('<body>contents</body>');
      done();
    });
  });
});
