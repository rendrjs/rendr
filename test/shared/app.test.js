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

    it('calls `postInitialize` if present', function() {
      var MyApp = App.extend({
        postInitialize: sinon.spy()
      });

      var app = new MyApp();

      app.postInitialize.should.have.been.called;
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
});
