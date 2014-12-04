var should = require('chai').should(),
    BaseModel = require('../../../shared/base/model'),
    modelUtils = require('../../../shared/modelUtils'),
    App = require('../../../shared/app'),
    addClassMapping = require('../../helpers/add_class_mapping');

describe('BaseModel', function() {
  beforeEach(function() {
    this.app = new App();
    this.app.fetcher.modelStore.clear();
    this.MyModel = BaseModel.extend({});
    this.MyModel.id = 'MyModel';

    addClassMapping(this.MyModel.id, this.MyModel);
  });

  it("should store the model on initialization", function () {
    var attrs, model, stored;

    attrs = {
      id: 9,
      status: 'pending'
    };
    model = new this.MyModel(attrs, {
      app: this.app
    });
    stored = this.app.fetcher.modelStore.get(this.MyModel.id, model.id);
    stored.should.deep.eql(model);
  });

  it("should update modelStore when id attribute changes", function() {
    var attrs, model, stored;

    attrs = {
      id: 9,
      status: 'pending'
    };
    model = new this.MyModel(attrs, {
      app: this.app
    });
    stored = this.app.fetcher.modelStore.get(this.MyModel.id, model.id);
    stored.should.deep.eql(model);

    attrs.id = 10;
    model.set({
      id: attrs.id
    });
    stored = this.app.fetcher.modelStore.get(this.MyModel.id, model.id);
    stored.should.deep.eql(model);

    // Add an attribute, make sure the store gets updated.
    attrs.name = 'Bobert';
    model.set({
      name: attrs.name
    });
    stored = this.app.fetcher.modelStore.get(this.MyModel.id, model.id);
    stored.should.deep.eql(model);
  });

  describe('store', function() {
    it("should store the model", function() {
      var attrs, model, stored;

      attrs = {
        id: 938,
        type: 'foobiz'
      };
      model = new this.MyModel(attrs, {
        app: this.app
      });
      model.store();
      stored = this.app.fetcher.modelStore.get(this.MyModel.id, model.id);
      stored.should.eql(model);
    });
  });

  describe('getUrl', function() {
    it('should support string URL', function() {
      var Model = this.MyModel.extend({
        url: '/path/to/model/:id'
      });
      var model = new Model({id: 33}, {app: this.app});
      model.getUrl().should.eql('/path/to/model/33');
    });

    it('should support function URL', function() {
      var Model = this.MyModel.extend({
        url: function() {
          return '/path/to/model/:id';
        }
      });
      var model = new Model({id: 33}, {app: this.app});
      model.getUrl(null).should.eql('/path/to/model/33');
    });

    it('should support client-side URL', function() {
      var Model = this.MyModel.extend({
        url: '/path/to/model/:id'
      });
      var model = new Model({id: 33}, {app: this.app});
      model.getUrl(null, true).should.eql('/api/-/path/to/model/33');
    });

    it('should support absolute URL', function() {
      var Model = this.MyModel.extend({
        url: 'https://api.example.com/path/to/model/:id'
      });
      var model = new Model({id: 33}, {app: this.app});
      model.getUrl().should.eql('https://api.example.com/path/to/model/33');
    });

    it('should support absolute URI with port', function() {
      var Model = this.MyModel.extend({
        url: 'https://api.example.com:3000/path/to/model/:id'
      });
      var model = new Model({id: 33}, {app: this.app});
      model.getUrl().should.eql('https://api.example.com:3000/path/to/model/33');
    });

    it('should support specifying an API as string', function() {
      var Model = this.MyModel.extend({
        url: '/path/to/model/:id',
        api: 'api-name'
      });
      var model = new Model({id: 33}, {app: this.app});
      model.getUrl(null, true).should.eql('/api/api-name/-/path/to/model/33');
    });

    it('should support specifying an API as function', function() {
      var Model = this.MyModel.extend({
        url: '/path/to/model/:id',
        api: function() {
          return 'api-name';
        }
      });
      var model = new Model({id: 33}, {app: this.app});
      model.getUrl(null, true).should.eql('/api/api-name/-/path/to/model/33');
    });
  });
});
