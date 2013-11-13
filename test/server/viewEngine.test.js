require('../../shared/globals');

var should = require('chai').should()
  , sinon = require('sinon')
  , ViewEngine = require('../../server/viewEngine')
  , BaseView = require('../../shared/base/view');

describe('ViewEngine', function() {
  var app, viewEngine;

  beforeEach(function() {

    viewEngine = new ViewEngine({renderData: {render: 'data'}});

    function layoutTemplate(locals) {
      return '<body>'+locals.body+'-'+locals.render+'</body>';
    }

    function View () {
      return {
        getHtml: sinon.stub().returns('contents')
      };
    }

    sinon.stub(BaseView, 'getView').returns(View);
    app = {
      templateAdapter: {
        getLayout: sinon.stub().yields(null, layoutTemplate)
      },
      toJSON: sinon.stub()
    };
  });

  afterEach(function() {
    BaseView.getView.restore();
  });

  it("should lookup the layout template via the app's templateAdapter", function(done) {
    viewEngine.render('name', {app: app}, function () {
      app.templateAdapter.getLayout.should.have.been.calledOnce;
      done();
    });
  });

  it("should pass the rendered view template to the layout template with the data in the render hash", function(done) {
    viewEngine.render('name', {app: app}, function (err, html) {
      html.should.equal('<body>contents-data</body>');
      done();
    });
  });
});
