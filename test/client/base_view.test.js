var App = require('../../shared/app'),
    expect = require('chai').expect,
    clientTestHelper = require('../helpers/client_test'),
    sinon = require('sinon'),
    $ = require('jquery');

describe('Base/View', function () {
  var BaseView;

  before(clientTestHelper.before);
  after(clientTestHelper.after);

  beforeEach(function () {
    BaseView = require('../../shared/base/view');

    this.app = new App();
    this.subject = new BaseView({ app: this.app });
  });

  describe('attachOrRender', function () {
    beforeEach(function () {
      this.$el = $('<div/>');
      this.parentView = new BaseView({ app: this.app });

      sinon.stub(this.subject, 'attach');
      sinon.stub(this.subject, 'render');
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
        this.$el = $('<div/>', { 'data-render': true });
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
});
