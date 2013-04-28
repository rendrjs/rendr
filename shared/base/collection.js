var Backbone, Base, BaseModel, syncer, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('underscore');
Backbone = require('backbone');
syncer = require('../syncer');
BaseModel = require('./model');

module.exports = Base = (function(_super) {
  __extends(Base, _super);

  Base.prototype.model = BaseModel;

  /*
  * Provide the ability to set default params for every 'fetch' call.
  */
  Base.prototype.defaultParams = null;

  function Base(models, options) {
    /*
    * Capture the options as instance variable.
    */
    this.options = options || {};

    /*
    * Store a reference to the app instance.
    */
    this.app = this.options.app;

    /*
    * Store a reference to the params that were used to
    * query for these models.
    */
    this.params = this.options.params || {};
    _.defaults(this.params, this.defaultParams || {});

    /*
    * Add 'meta' property to store the parts of the response
    * that aren't part of the jsonKey.
    */
    this.meta = {};
    if (_.isObject(this.options.meta)) {
      _.extend(this.meta, this.options.meta);
      delete this.options.meta;
    }

    Base.__super__.constructor.apply(this, arguments);
  }

  /*
  * Make sure that `model.app` is set for all operations like
  * `this.add()`, `this.reset()`, `this.set()`, `this.push()`, etc.
  */
  Base.prototype._prepareModel = function() {
    var model;
    model = Base.__super__._prepareModel.apply(this, arguments);
    model.app = this.app;
    return model;
  };

  /*
  * Idempotent parse
  */
  Base.prototype.parse = function(resp, modifyInstance) {
    var jsonResp, meta, parsed;

    if (modifyInstance == null) {
      modifyInstance = true;
    }
    if (this.jsonKey && (jsonResp = resp[this.jsonKey])) {
      if (modifyInstance) {
        meta = _.omit(resp, this.jsonKey);
        _.extend(this.meta, meta);
      }
      parsed = jsonResp;
    } else {
      parsed = resp;
    }
    return this.parseModels(parsed);
  };

  Base.prototype.parseModels = function(resp) {
    var jsonKey, jsonKeyResp;

    resp = _.clone(resp);
    jsonKey = this.model.prototype.jsonKey;
    _.each(resp, function(modelResp, i) {
      jsonKeyResp = modelResp[jsonKey];
      if (jsonKeyResp) {
        resp[i] = jsonKeyResp;
      }
    });
    return resp;
  };

  Base.prototype.fetch = function(options) {
    options = options || {};

    // Each time new models are fetched, store the params used.
    options.data = options.data || {};
    _.defaults(options.data, this.defaultParams || {});
    this.params = options.data;
    return Base.__super__.fetch.apply(this, arguments);
  };

  Base.prototype.lastCheckedFresh = null;

  Base.prototype.checkFresh = syncer.checkFresh;

  Base.prototype.sync = syncer.getSync();

  Base.prototype.getUrl = syncer.getUrl;

  /*
  * Instance method to store the collection and its models.
  */
  Base.prototype.store = function() {
    this.each(function(model) {
      model.store();
    });
    this.app.fetcher.collectionStore.set(this);
  };

  return Base;

})(Backbone.Collection);
