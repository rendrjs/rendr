var sinon = require('sinon'),
    should = require('chai').should(),
    App = require('../../shared/app'),
    _ = require('underscore');

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

    it('calls the initializeTemplateAdapter method with proper arguments', function() {
      var myTemplateAdapter = {};
      var MyApp = App.extend({
        initializeTemplateAdapter: sinon.spy()
      });
      var app = new MyApp(null, {templateAdapterInstance: myTemplateAdapter, entryPath: 'entryPath'});

      app.initializeTemplateAdapter.should.have.been.calledWith('entryPath', {});
    });
  });

  describe('initializeTemplateAdapter', function() {
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
  });

  describe('getTemplateFinder', function() {
    it('returns null', function() {
      var app = new App(null, {});
      var templateFinder = app.getTemplateFinder();
      expect(templateFinder).to.be.undefined;
    });
  });

  describe('setTemplateFinder', function() {
    it('calls getTemplatefinder', function() {
      var MyApp = App.extend({
        getTemplateFinder: sinon.spy()
      });
      var app = new MyApp(null, {});

      app.getTemplateFinder.should.have.been.called;
    });

    context('if getTemplateFinder is a function and not noop', function() {
      it('sets the templateFinder option correctly', function() {
        var myTemplateFinder = {templatePatterns: []};
        var MyApp = App.extend({
          getTemplateFinder: function() {return myTemplateFinder;}
        });
        var app = new MyApp(null, {});

        var templateAdapterOptions = app.setTemplateFinder({});
        expect(templateAdapterOptions.templateFinder).to.be.deep.equal(myTemplateFinder);
      });
    });

    context('if getTemplateFinder is not a function or is noop', function() {
      it('leaves the option templateFinder undefined', function() {
        var MyApp = App.extend({
          getTemplateFinder: 'myGetTemplateFinder'
        });
        var app = new MyApp(null, {});
        var templateAdapterOptions = app.setTemplateFinder({});
        expect(templateAdapterOptions.templateFinder).to.be.undefined;
      });
    });

    context('if getTemplateFinder is not a function or is noop', function() {
      it('leaves the option templateFinder undefined', function() {
        var MyApp = App.extend({
          getTemplateFinder: _.noop
        });
        var app = new MyApp(null, {});

        var templateAdapterOptions = app.setTemplateFinder({});
        expect(templateAdapterOptions.templateFinder).to.be.undefined;
      });
    });
  });
});
