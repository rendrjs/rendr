var App = require('../../shared/app'),
    expect = require('chai').expect,
    clientTestHelper = require('../helpers/client_test'),
    sinon = require('sinon'),
    Model = require('../../shared/base/model'),
    Collection = require('../../shared/base/collection');

describe('Base/View', function () {
  var BaseView;

  before(function () {
    global.document = {
      createElement: sinon.stub().returns('<div></div>')
    }

    clientTestHelper.before.apply(this, arguments);
    BaseView = require('../../shared/base/view');
  });

  after(function () {
    global.document = undefined;
    clientTestHelper.after.apply(this, arguments);
  });

  beforeEach(function () {
    this.app = new App();
    this.subject = new BaseView({ app: this.app });

    this.fetchSpec = function () {
      return this.subject.app.fetch.args[0][0];
    };
  });

  describe('fetchLazy', function () {
    var params;

    beforeEach(function () {
      sinon.stub(this.subject, 'setLoading');
      sinon.stub(this.app, 'fetch');

      this.subject.options.model_name = 'TestModel';
      this.subject.options.collection_name = 'TestCollection';
    });

    afterEach(function () {
      this.app.fetch.restore();
      this.subject.setLoading.restore();
    });

    it('sets loading to true and calls fetch', function () {
      this.subject.fetchLazy();
      expect(this.subject.setLoading).to.have.been.calledWith(true);
      expect(this.subject.app.fetch).to.have.been.called;
    });

    context('it has fetch_params', function () {
      beforeEach(function() {
        params = { test: 'param' };
        this.subject.options.fetch_params = params;
      });

      it('should use the object as the parameters for a model', function () {
        this.subject.fetchLazy();
        expect(this.fetchSpec().model).to.deep.equal({
          model: 'TestModel',
          params: params
        });
      });

      it('should use the object as the parameters for a collection', function () {
        this.subject.options.model_name = null;

        this.subject.fetchLazy();
        expect(this.fetchSpec().collection).to.deep.equal({
          collection: 'TestCollection',
          params: params
        });
      });

      it('should throw an error if passed a non-object', function () {
        this.subject.options.fetch_params = 'test';
        expect(this.subject.fetchLazy).to.throw(Error);
      });

    });

    context('it has param_name and param_value', function () {
      beforeEach(function () {
        params = {
          param_name: 'test',
          param_value: 'param'
        };

        this.subject.options = params;
      });

      it('should use the correct parameters for a model', function () {
        this.subject.options.model_name = 'TestModel';
        this.subject.fetchLazy();

        expect(this.fetchSpec().model).to.deep.equal({
          model: 'TestModel',
          params: { test: 'param' }
        });
      });

      it('should use the correct parameters for a collection', function () {
        this.subject.options.collection_name = 'TestCollection';
        this.subject.fetchLazy();

        expect(this.fetchSpec().collection).to.deep.equal({
          collection: 'TestCollection',
          params: { test: 'param' }
        });
      });
    });

    context('there is a model_id', function () {
      beforeEach(function () {
        params = {
          model_name: 'MyModel',
          model_id: 1
        }

        this.subject.options = params;
      });

      it('should set the id parameter for a model', function () {
        this.subject.fetchLazy();

        expect(this.fetchSpec().model).to.deep.equal({
          model: 'MyModel',
          params: { id: 1 }
        });
      });

    });
  });

  describe('attachOrRender', function () {
    beforeEach(function () {
      this.$el = global.window.$('<div/>');
      this.parentView = new BaseView({ app: this.app });

      sinon.stub(this.subject, 'attach');
      sinon.stub(this.subject, 'render').returns({ $el: '<div></div>' });
      sinon.stub(this.subject, 'fetchLazy');
    });

    afterEach(function () {
      this.subject.attach.restore();
      this.subject.render.restore();
      this.subject.fetchLazy.restore();
    });

    it('should set all of the data for rendering or attaching a view', function () {
      this.subject.attachOrRender(this.$el, this.parentView);

      expect(this.subject.parentView).to.deep.equal(this.parentView);
      expect(this.subject.viewing).to.be.true;
      expect(this.$el.data('view-attached')).to.be.true;
    });

    context('element has data-render true', function () {
      beforeEach(function () {
        this.$el = global.window.$('<div/>', { 'data-render': true });
      });

      context('is lazy loaded', function () {
        beforeEach(function () {
          this.subject.options.lazy = true;
        });

        it('should call fetchLazy', function () {
          this.subject.attachOrRender(this.$el, this.parentView);

          expect(this.subject.fetchLazy).to.have.been.called;
          expect(this.subject.render).to.not.have.been.called;
        });
      });

      context('is not lazy loaded', function () {
        it('should call render', function () {
          this.subject.attachOrRender(this.$el, this.parentView);

          expect(this.subject.render).to.have.been.called;
          expect(this.subject.attach).to.not.have.been.called;
        });
      });
    });

    context('default case', function () {
      it('should call attach', function () {
        this.subject.attachOrRender(this.$el, this.parentView);
        expect(this.subject.attach).to.have.been.called;
      });
    });
  });

  describe('getTemplateData', function () {
    beforeEach(function() {
      this.subject.options = { test: 'test' };
    });

    it('should just return the options', function () {
      expect(this.subject.getTemplateData()).to.deep.equal(this.subject.options);
    });

    it('should make a copy of the options', function () {
      expect(this.subject.getTemplateData()).to.not.equal(this.subject.options);
    });

    it('should remove app from the templateData', function() {
      this.subject.options.app = this.app;
      expect(this.subject.getTemplateData()).to.deep.equal({
        test: 'test'
      });
    });

    context('there is a model', function () {
      beforeEach(function () {
        this.subject.model = new Model({
          myOption: 'test'
        });
      });

      it('should apply the options to the model data', function () {
        expect(this.subject.getTemplateData()).to.deep.equal({
          myOption: 'test',
          test: 'test'
        });
      });

      it('should override the model attribute if it is the same as the option on the view', function() {
        this.subject.options.myOption = 'helloWorld';
        expect(this.subject.getTemplateData()).to.deep.equal({
          myOption: 'helloWorld',
          test: 'test'
        });
      });

      it('should remove the model from the options', function() {
        this.subject.options.model = this.subject.model;

        expect(this.subject.getTemplateData()).to.deep.equal({
          myOption: 'test',
          test: 'test'
        });
      });
    });

    context('there is a collection', function () {
      var collectionModel = {
        id: 1,
        myOption: 'test'
      };

      var collectionMeta = { page: 1 },
          collectionParams = { locale: 'en' };

      beforeEach(function () {
        this.subject.collection = new Collection([collectionModel]);
        this.subject.collection.meta = collectionMeta;
        this.subject.collection.params = collectionParams;
      });

      it('should return the models, collection meta information, and params with the options', function () {
        expect(this.subject.getTemplateData()).to.deep.equal({
          models: [collectionModel],
          meta: collectionMeta,
          params: collectionParams,
          test: 'test'
        });
      });

      it('should remove "collection" from the options', function() {
        this.subject.options.collection = this.subject.collection;

        expect(this.subject.getTemplateData()).to.deep.equal({
          models: [collectionModel],
          meta: collectionMeta,
          params: collectionParams,
          test: 'test'
        });
      });
    });

  });

});
