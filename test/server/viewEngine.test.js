var should = require('chai').should(),
    sinon = require('sinon'),
    ViewEngine = require('../../server/viewEngine'),
    BaseView = require('../../shared/base/view'),
    BaseModel = require('../../shared/base/model'),
    BaseCollection = require('../../shared/base/collection'),
    App = require('../../shared/app');

describe('ViewEngine', function() {
  var app, viewEngine;

  beforeEach(function() {

    viewEngine = new ViewEngine;

    function layoutTemplate(locals) {
      return '<body>'+locals.body+'</body>';
    }

    function View () {
      return {
        getHtml: sinon.stub().returns('contents')
      };
    }

    sinon.stub(BaseView, 'getView').returns(View);
    app = new App();
    sinon.stub(app.templateAdapter, 'getLayout').yields(null, layoutTemplate);
  });

  afterEach(function() {
    BaseView.getView.restore();
    viewEngine.clearCachedLayouts();
  });

  it("should lookup the layout template via the app's templateAdapter", function(done) {
    viewEngine.render('name', {app: app}, function () {
      app.templateAdapter.getLayout.should.have.been.calledOnce;
      done();
    });
  });

  it("should pass the rendered view template to the layout template", function(done) {
    viewEngine.render('name', {app: app}, function (err, html) {
      html.should.equal('<body>contents</body>');
      done();
    });
  });

  it('should pass through the error object', function (done) {
    var error = new Error('some error');

    app.templateAdapter.getLayout.yields(error);

    viewEngine.render('name', {app: app}, function (err) {
      err.should.be.an.instanceof(Error);
      err.should.have.property('message', 'some error');
      done();
    })
  });

  it('should cache the layout template functions', function (done) {
    viewEngine.render('name', {app: app}, function () {
      viewEngine.render('name', {app: app}, function () {
        app.templateAdapter.getLayout.should.have.been.calledOnce;
        done();
      });
    });
  });

  describe('getBootstrappedData', function () {
    var Model, Collection;

    before(function () {
      Model = BaseModel.extend({});
      Model.id = 'Model';
      Collection = BaseCollection.extend({model: Model});
      Collection.id = 'Collection';

    });


    it('should create bootstrap data from models and collection', function () {
      var locals = {
          foo: new  Model({ id: 321, foo: 'bar' }, { app: app }),
          bar: new Collection([ new Model({ id: 123, foo: 'bar' }, { app: app} ) ], { app: app })
        },
        expectedData = {
          foo: {
            data: { foo: 'bar', id: 321 },
            summary: { model: 'model', id: 321 }
          },
          bar: {
            data: [ { foo: 'bar', id: 123 } ],
            summary: { collection: 'collection', ids: [ 123 ], meta: {}, params: {} }
          }
        },
        data;

      data = viewEngine.getBootstrappedData(locals, app);
      data.should.deep.equal(expectedData);
    });

    it('should ignore properties which aren’t a model or collection', function () {
      var locals = { foo: true, bar: [ 1, 2, 3, 4 ] },
        data = viewEngine.getBootstrappedData(locals, app);

      data.should.deep.equal({});
    });
  });
});
