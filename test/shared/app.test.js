var sinon = require('sinon'),
    should = require('chai').should(),
    App = require('../../shared/app');

describe('BaseApp', function() {
  describe('initialize', function() {
    it('is called', function() {
      var MyApp = App.extend({
        initialize: sinon.spy()
      });

      var app = new MyApp();

      app.initialize.should.have.been.called;
    });

    it('can access `this.templateAdapter` in `initialize`', function() {
      var MyApp = App.extend({
        initialize: function() {
          if (this.templateAdapter == null) {
            throw new Error('Cannot access `templateAdapter` in initialize');
          }
        }
      });

      new MyApp();
    });
  });

  describe('constructor', function() {
    context('with a custom templateAdapter module name', function() {
      beforeEach(function () {
        this.attributes = {templateAdapter: '../test/fixtures/app/template_adapter'};
      });

      it('creates the templateAdapter we specify', function() {
        var app = new App(this.attributes);

        expect(app.templateAdapter).to.have.property('name', 'Test template adapter');
      });

      it('supplies the entryPath to the template adapter', function() {
        var app = new App(this.attributes, {entryPath: 'myEntryPath'});

        expect(app.templateAdapter).to.have.deep.property('suppliedOptions.entryPath', 'myEntryPath');
      });
    });

    context('with a concrete templateAdapterInstance', function() {
      it('uses the supplied templateAdapterInstance', function() {
        var myTemplateAdapter = {};
        var app = new App(null, {templateAdapterInstance: myTemplateAdapter});

        expect(app.templateAdapter).to.equal(myTemplateAdapter);
      });

      it('does not try to require a template adapter by name', function () {
        new App({
          templateAdapter: 'non existent module name - should throw'
        }, {
          templateAdapterInstance: {}
        });
      });
    });
  });
});
