var _ = require('underscore'),
    chai = require('chai'),
    should = chai.should(),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    ModelUtils = require('../../shared/modelUtils'),
    modelUtils = new ModelUtils(),
    AddClassMapping = require('../helpers/add_class_mapping'),
    addClassMapping = new AddClassMapping(modelUtils),
    BaseModel = require('../../shared/base/model'),
    BaseCollection = require('../../shared/base/collection'),
    App = require('../../shared/app'),
    fetcher = null;

chai.use(sinonChai);

var listingResponses = {
  basic: {
    name: 'Fetching!'
  },
  full: {
    name: 'Fetching!',
    city: 'San Francisco'
  }
};

var Listing = BaseModel.extend({
  jsonKey: 'listing',

  fetch: function(options) {
    var resp,
      _this = this;

    resp = getModelResponse('full', options.data.id, true);
    setTimeout(function() {
      var parsed = _this.parse(resp);
      _this.set(parsed);
      options.success(_this, parsed);
    }, 1);
  }
});
Listing.id = 'Listing';

var Listings = BaseCollection.extend({
  model: Listing,
  jsonKey: 'listings',

  fetch: function(options) {
    var resp,
      _this = this;

    resp = buildCollectionResponse(true);
    if (options.data != null) {
      resp.meta = options.data;
    }
    setTimeout(function() {
      var parsed = _this.parse(resp);
      _this.reset(parsed.map(function(attrs) {
        return new _this.model(attrs, {
          parse: true
        });
      }));
      options.success(_this, parsed);
    }, 1);
  }
});
Listings.id = 'Listings';

addClassMapping.add('Listing', Listing);
addClassMapping.add('Listings', Listings);

function getModelResponse(version, id, addJsonKey) {
  var resp;

  if (addJsonKey == null) {
    addJsonKey = false;
  }
  resp = _.extend({}, listingResponses[version], {
    id: id
  });
  if (addJsonKey) {
    return _.tap({}, function(obj) {
      obj.listing = resp;
    });
  } else {
    return resp;
  }
}

function buildCollectionResponse(addJsonKey) {
  var resp;

  if (addJsonKey == null) {
    addJsonKey = false;
  }
  resp = [1, 2, 3, 4, 5].map(function(id) {
    return getModelResponse('basic', id, addJsonKey);
  });
  if (addJsonKey) {
    return _.tap({}, function(obj) {
      obj.listings = resp;
    });
  } else {
    return resp;
  }
}

describe('fetcher', function() {
  beforeEach(function() {
    this.app = new App(null, {modelUtils: modelUtils});
    fetcher = this.app.fetcher;
  });

  describe('buildOptions', function () {
     it('should merge the app and parse with custom options', function () {
       fetcher.buildOptions().should.be.deep.equal({app: this.app, parse: true});
     });

    it('should append specified additional options', function () {
      fetcher.buildOptions({foo: 'bar'}).should.be.deep.equal({foo: 'bar', app: this.app, parse: true});
    });

    it('should merge specified params with specified options that are empty', function () {
      fetcher.buildOptions(null, {foo: 'bar'}).should.be.deep.equal({foo: 'bar', app: this.app, parse: true});
    });

    it('should merge specified params with the specified options', function () {
      var additionalOptions = {anyOption: 'withValue'},
        params = {anyParam: 'paramValue'},
        expected = {
          app: this.app,
          parse: true,
          anyOption: 'withValue',
          anyParam: 'paramValue'
        };

      fetcher.buildOptions(additionalOptions, params).should.be.deep.equal(expected);
    });
  });

  describe('getModelOrCollectionForSpec', function () {
    beforeEach(function () {
      sinon.stub(modelUtils, 'getModelConstructor').returns(BaseModel);
      sinon.stub(modelUtils, 'getCollectionConstructor').returns(BaseCollection);
    });

    afterEach(function () {
      modelUtils.getModelConstructor.restore();
      modelUtils.getCollectionConstructor.restore();
    });

    it('should return an empty model', function () {
      var model = fetcher.getModelOrCollectionForSpec({ model: 'SomeModel' });

      modelUtils.getModelConstructor.should.have.been.calledOnce;
      modelUtils.getModelConstructor.should.have.been.calledWith('SomeModel');

      model.should.be.instanceOf(BaseModel);
      model.attributes.should.be.empty;
    });

    it('should return an empty collection', function () {
      var collection = fetcher.getModelOrCollectionForSpec({ collection: 'SomeCollection' });

      modelUtils.getCollectionConstructor.should.have.been.calledOnce;
      modelUtils.getCollectionConstructor.should.have.been.calledWith('SomeCollection');

      collection.should.be.instanceOf(BaseCollection);
      collection.should.have.length(0);
    });
  });

  describe('hydrate', function() {
    beforeEach(function() {
      fetcher.modelStore.clear();
      fetcher.collectionStore.clear();
    });

    it("should be able store and hydrate a model", function(done) {
      var fetchSummary, listing, rawListing, results;

      rawListing = {
        id: 9,
        name: 'Sunny'
      };
      listing = new Listing(rawListing, {
        app: this.app
      });
      results = {
        listing: listing
      };
      fetchSummary = {
        listing: {
          model: 'listing',
          id: 9
        }
      };
      fetcher.storeResults(results);
      fetcher.hydrate(fetchSummary, function(err, hydrated) {
        hydrated.listing.should.equal(listing);
        done();
      });
    });

    it("should be able to store and hydrate a collection", function(done) {
      var fetchSummary, listings, params, rawListings, results;

      rawListings = [
        {
          id: 1,
          name: 'Sunny'
        }, {
          id: 3,
          name: 'Cloudy'
        }, {
          id: 99,
          name: 'Tall'
        }
      ];
      params = {
        items_per_page: 99
      };
      listings = new Listings(rawListings, {
        params: params,
        app: this.app
      });
      results = {
        listings: listings
      };
      fetchSummary = {
        listings: {
          collection: 'listings',
          ids: _.pluck(rawListings, 'id'),
          params: params
        }
      };
      fetcher.storeResults(results);
      fetcher.hydrate(fetchSummary, function(err, hydrated) {
        hydrated.listings.should.equal(listings);
        should.not.exist(fetcher.collectionStore.get('Listings', {}));
        fetcher.collectionStore.get('Listings', params).should.eql(listings);
        done();
      });
    });

    it("should be able to hydrate multiple objects at once", function(done) {
      var fetchSummary, listing, listings, rawListing, rawListings, results;

      rawListing = {
        id: 9,
        name: 'Sunny'
      };
      rawListings = [
        {
          id: 1,
          name: 'Sunny'
        }, {
          id: 3,
          name: 'Cloudy'
        }, {
          id: 99,
          name: 'Tall'
        }
      ];
      listing = new Listing(rawListing, {
        app: this.app
      });
      listings = new Listings(rawListings, {
        app: this.app
      });
      results = {
        listing: listing,
        listings: listings
      };
      fetchSummary = {
        listing: {
          model: 'listing',
          id: 9
        },
        listings: {
          collection: 'listings',
          ids: [1, 3, 99]
        }
      };
      fetcher.storeResults(results);
      fetcher.hydrate(fetchSummary, function(err, hydrated) {
        hydrated.listing.should.equal(listing);
        hydrated.listings.should.equal(listings);
        done();
      });
    });

    it("should inject the app instance", function(done) {
      var app, listing1, model, summaries;

      listing1 = new Listing({
        id: 1
      });
      fetcher.modelStore.set(listing1);
      summaries = {
        model: {
          id: 1,
          model: 'Listing'
        }
      };
      app = {
        fake: 'app'
      };
      fetcher.hydrate(summaries, {app: app}, function(err, results) {
        model = results.model;
        model.app.should.eql(app);
        done();
      });
    });
  });

  describe('fetch', function() {
    beforeEach(function() {
      fetcher.modelStore.clear();
      fetcher.collectionStore.clear();
      fetcher.off(null, null);
    });

    it("should be able to fetch a model", function(done) {
      var fetchSpec;

      fetchSpec = {
        model: {
          model: 'Listing',
          params: {
            id: 1
          }
        }
      };
      fetcher.pendingFetches.should.eql(0);
      fetcher.fetch(fetchSpec, function(err, results) {
        fetcher.pendingFetches.should.eql(0);
        if (err) return done(err);
        results.model.should.be.an.instanceOf(Listing);
        results.model.toJSON().should.eql(getModelResponse('full', 1));
        done();
      });
      fetcher.pendingFetches.should.eql(1);
    });

    it("should propagate timeout option to model fetch", function(done) {
      var timeoutSpy = sinon.spy();
      var Test = BaseModel.extend({
        jsonKey: 'timeout',
        fetch: timeoutSpy
      });
      Test.id = 'Timeout';
      addClassMapping.add('Timeout', Test);
      var fetchSpec;

      fetchSpec = {
        model: {
          model: 'Timeout',
          params: {
            id: 1
          }
        }
      };

      fetcher.fetch(fetchSpec, { timeout: 1000 }, function(err, results) { });
      done();

      timeoutSpy.should.be.calledWith(sinon.match({ timeout: 1000 }))
    });

    it("should set default timeout to 0 in options to model fetch", function(done) {
      var timeoutSpy = sinon.spy();
      var Test = BaseModel.extend({
        jsonKey: 'timeout',
        fetch: timeoutSpy
      });
      Test.id = 'Timeout';
      addClassMapping.add('Timeout', Test);
      var fetchSpec;

      fetchSpec = {
        model: {
          model: 'Timeout',
          params: {
            id: 1
          }
        }
      };

      fetcher.fetch(fetchSpec, function(err, results) { });
      done();

      timeoutSpy.should.be.calledWith(sinon.match({ timeout: 0 }))
    });

    it("should be able to fetch a collection", function(done) {
      var fetchSpec;

      fetchSpec = {
        collection: {
          collection: 'Listings'
        }
      };
      fetcher.pendingFetches.should.eql(0);
      fetcher.fetch(fetchSpec, function(err, results) {
        fetcher.pendingFetches.should.eql(0);
        if (err) return done(err);
        results.collection.should.be.an.instanceOf(Listings);
        results.collection.toJSON().should.eql(buildCollectionResponse());
        done();
      });
      fetcher.pendingFetches.should.eql(1);
    });

    it("should be able to fetch a collection normally and from cache", function(done) {
      var fetchSpec;
      models = [
        {
          id: 1,
          name: 'foo'
        }, {
          id: 2,
          name: 'bar'
        }
      ];
      params = {
        some: 'key',
        other: 'value'
      };
      var collectionCached = new Listings(models, {
        params: params
      });
      fetcher.collectionStore.set(collectionCached);

      fetchSpec = {
        collectionNormal: {
          collection: 'Listings',
          readFromCache: false
        },
        collectionFetchedCached: {
          collection: 'Listings',
          params: params,
          readFromCache: true
        }
      };
      fetcher.pendingFetches.should.eql(0);
      fetcher.fetch(fetchSpec, function(err, results) {
        fetcher.pendingFetches.should.eql(0);
        if (err) return done(err);

        results.collectionNormal.should.be.an.instanceOf(Listings);
        results.collectionNormal.toJSON().should.eql(buildCollectionResponse());

        results.collectionFetchedCached.should.be.an.instanceOf(Listings);
        results.collectionFetchedCached.toJSON().should.eql(models);

        done();
      });
      fetcher.pendingFetches.should.eql(1);
    });

    it("should be able to fetch a model normally and from cache", function(done) {
      var fetchSpec;
      var listingAttrs = {
        id: 'myId',
        name: 'New Name'
      };
      var listingName = new Listing(listingAttrs);
      fetcher.modelStore.set(listingName);

      fetchSpec = {
        modelNoCache: {
          model: 'Listing',
          params: {
            id: 1
          },
          readFromCache: false
        },
        modelCached: {
          model: 'Listing',
          params: {
            id: 'myId'
          },
          readFromCache: true
        }
      };

      fetcher.pendingFetches.should.eql(0);
      fetcher.fetch(fetchSpec, function(err, results) {
        fetcher.pendingFetches.should.eql(0);
        if (err) return done(err);
        results.modelNoCache.should.be.an.instanceOf(Listing);
        results.modelNoCache.toJSON().should.eql(getModelResponse('full', 1));

        results.modelCached.should.be.an.instanceOf(Listing);
        results.modelCached.toJSON().should.eql(listingAttrs);

        done();
      });
      fetcher.pendingFetches.should.eql(1);
    });

    it("should be able to fetch both a model and a collection at the same time", function(done) {
      var fetchSpec;

      fetchSpec = {
        model: {
          model: 'Listing',
          params: {
            id: 1
          }
        },
        collection: {
          collection: 'Listings'
        }
      };
      fetcher.pendingFetches.should.eql(0);
      fetcher.fetch(fetchSpec, function(err, results) {
        fetcher.pendingFetches.should.eql(0);
        if (err) return done(err);
        results.model.should.be.an.instanceOf(Listing);
        results.model.toJSON().should.eql(getModelResponse('full', 1));
        results.collection.should.be.an.instanceOf(Listings);
        results.collection.toJSON().should.eql(buildCollectionResponse());
        done();
      });
      fetcher.pendingFetches.should.eql(1);
    });

    it("should be able to fetch models from cache with custom idAttribute", function(done) {
      var fetchSpec, someperson, userAttrs, User;

      User = BaseModel.extend({
        idAttribute: 'login'
      });
      User.id = 'User';

      userAttrs = {
        login: 'someperson',
        name: 'Some Person'
      };
      someperson = new User(userAttrs);
      addClassMapping.add('user', User);
      fetcher.modelStore.set(someperson);
      fetchSpec = {
        model: {
          model: 'user',
          params: {
            login: 'someperson'
          }
        }
      };
      fetcher.fetch(fetchSpec, {
        readFromCache: true
      }, function(err, results) {
        if (err) return done(err);
        results.model.should.be.an.instanceOf(User);
        results.model.toJSON().should.eql(userAttrs);
        done();
      });
    });

    it("should be able to fetch a model from cache with other attributes", function(done) {
      var fetchSpec;
      var listingAttrs = {
        id: 'myId',
        name: 'New Name'
      };
      listingWithName = new Listing(listingAttrs);
      fetcher.modelStore.set(listingWithName);

      fetchSpec = {
        model: {
          model: 'Listing',
          params: {
            name: 'New Name'
          }
        }
      };
      fetcher.pendingFetches.should.eql(0);
      fetcher.fetch(fetchSpec, {readFromCache: true}, function(err, results) {
        fetcher.pendingFetches.should.eql(0);
        if (err) return done(err);
        results.model.should.be.an.instanceOf(Listing);
        results.model.toJSON().should.eql(listingAttrs);
        done();
      });
      fetcher.pendingFetches.should.eql(0);

    });


    it("should be able to re-fetch if already exists but is missing key", function(done) {
      // First, fetch the collection, which has smaller versions of the models.
      var fetchSpec;

      fetchSpec = {
        collection: {
          collection: 'Listings'
        }
      };

      fetcher.fetch(fetchSpec, {
        writeToCache: true
      }, function(err, results) {
        if (err) return done(err);

        results.collection.toJSON().should.eql(buildCollectionResponse());

        // Make sure that the basic version is stored in modelStore.
        var model = results.collection.get(1);
        var storedModel = fetcher.modelStore.get('Listing', 1);

        storedModel.should.eql(model);

        // Then, fetch the single model, which should be cached.
        fetchSpec = {
          model: {
            model: 'Listing',
            params: {
              id: 1
            }
          }
        };

        fetcher.fetch(fetchSpec, {
          readFromCache: true
        }, function(err, results) {
          if (err) return done(err);
          results.model.should.eql(model);

          // Finally, fetch the single model, but specifiy that certain key must be present.
          fetchSpec = {
            model: {
              model: 'Listing',
              params: {
                id: 1
              },
              ensureKeys: ['city']
            }
          };

          fetcher.fetch(fetchSpec, {
            readFromCache: true
          }, function(err, results) {
            if (err) return done(err);
            results.model.toJSON().should.eql(getModelResponse('full', 1));
            done();
          });
        });
      });
    });

    it("should emit events", function(done) {
      var endEmitted, fetchSpec, startEmitted;

      startEmitted = false;
      endEmitted = false;
      fetcher.on('fetch:start', function(eventFetchSpec) {
        startEmitted = true;
        eventFetchSpec.should.eql(fetchSpec);
      });
      fetcher.on('fetch:end', function(eventFetchSpec) {
        endEmitted = true;
        eventFetchSpec.should.eql(fetchSpec);
      });
      fetchSpec = {
        model: {
          model: 'Listing',
          params: {
            id: 1
          }
        }
      };
      fetcher.fetch(fetchSpec, function(err, results) {
        if (err) return done(err);
        startEmitted.should.be.true;
        endEmitted.should.be.true;
        results.model.should.be.an.instanceOf(Listing);
        results.model.toJSON().should.eql(getModelResponse('full', 1));
        done();
      });
      startEmitted.should.be.true;
      endEmitted.should.be.false;
    });
  });

  describe('isMissingKeys', function() {
    before(function() {
      this.modelData = {
        id: 1,
        name: 'foobar'
      };
    });

    it("should be false if keys not passed in", function() {
      fetcher.isMissingKeys(this.modelData, void 0).should.be.false;
      fetcher.isMissingKeys(this.modelData, []).should.be.false;
    });

    it("should be false if keys passed in but are present", function() {
      fetcher.isMissingKeys(this.modelData, 'name').should.be.false;
      fetcher.isMissingKeys(this.modelData, ['name']).should.be.false;
      fetcher.isMissingKeys(this.modelData, ['id', 'name']).should.be.false;
    });

    it("should be true if keys passed in are not present", function() {
      fetcher.isMissingKeys(this.modelData, 'city').should.be.true;
      fetcher.isMissingKeys(this.modelData, ['city']).should.be.true;
      fetcher.isMissingKeys(this.modelData, ['id', 'city']).should.be.true;
    });
  });

  describe('summarize', function() {
    it("should summarize a model", function() {
      var attrs, model, summary;

      attrs = {
        id: 1234,
        blahblah: 'boomtown'
      };
      model = new Listing(attrs);
      summary = fetcher.summarize(model);
      summary.model.should.eql('listing');
      summary.id.should.eql(attrs.id);
    });

    it("should support custom idAttribute", function() {
      var attrs, model, summary, CustomListing;

      attrs = {
        login: 'joeschmo',
        blahblah: 'boomtown'
      };

      CustomListing = BaseModel.extend({
        idAttribute: 'login'
      });
      CustomListing.id = 'CustomListing';

      model = new CustomListing(attrs);
      summary = fetcher.summarize(model);
      summary.model.should.eql('custom_listing');
      summary.id.should.eql(attrs.login);
    });

    it("should summarize a collection", function() {
      var collection, meta, models, params, summary;

      models = [
        {
          id: 1,
          name: 'foo'
        }, {
          id: 2,
          name: 'bar'
        }
      ];
      params = {
        some: 'key',
        other: 'value'
      };
      meta = {
        the: 'one',
        foo: 'butt'
      };
      collection = new Listings(models, {
        params: params,
        meta: meta
      });
      summary = fetcher.summarize(collection);
      summary.collection.should.eql('listings');
      summary.ids.should.eql([1, 2]);
      summary.params.should.eql(params);
      summary.meta.should.eql(meta);
    });
  });

  describe('bootstrapData', function() {
    var attr, listingModel, bootstrapMockData;

    beforeEach(function () {
      attr = {id: 1, name: 'foobar', location: 'San Francisco'};
      listingModel = new Listing(attr, {app: this.app});
      bootstrapMockData = {'model':{'summary':{'model':'user','id':'1'},'data':{'name':'foobar', 'location': 'San Francisco'}}};
    });

    it('should call the callback function', function (done) {
      var getModelOrCollectionForSpecSpy = sinon.spy(fetcher, 'getModelOrCollectionForSpec');

      var bootstrapData = fetcher.bootstrapData(bootstrapMockData, function(results) {
        results.should.be.an('object');
        results.should.have.property('model');
        results['model'].attributes.should.deep.equal(bootstrapMockData.model.data);
        done();
      });
    });

  });

  describe('retrieveModels', function() {
    var modelAttrs;

    beforeEach(function () {
      modelAttrs = { id: 1 };

      this.expectedModel = new Listing(modelAttrs);
      fetcher.modelStore.set(this.expectedModel);
    });

    it('should return the models from the given ids', function () {
      // it should be the exact same model
      this.expectedModel.should.equal(fetcher.retrieveModels('Listing', [1])[0]);
      this.expectedModel.should.deep.equal(fetcher.retrieveModels('Listing', [1])[0]);
    });
  });

  describe('getCollectionForSpec', function () {
    var spec, params;

    beforeEach(function () {
      params = { name: 'test' }
      spec = { collection: 'Listings', params: params };
    });

    it('the options should include a `params` attribute for the collection store', function () {
      var result = fetcher.getCollectionForSpec(spec);
      expect(result.params).to.deep.equal(params);
      expect(result.options.params).to.deep.equal(params);
    });
  });

  describe('fetchFromApi', function(done) {
    var spec, options, callbackSpy, modelMock;

    beforeEach(function () {
      spec = { model: 'SomeModel' };
      options = {readFromCache: false};
      callbackSpy = sinon.spy();
      modelMock = {fetch: sinon.spy()};
    });

    it('should call the getModelOrCollectionForSpec with callback', function (done) {
      var lastCall, getModelOrCollectionForSpecStub = sinon.stub(fetcher, 'getModelOrCollectionForSpec');
      getModelOrCollectionForSpecStub.callsArgWith(3, modelMock);

      fetcher.fetchFromApi(spec, options, callbackSpy);

      callbackSpy.should.have.not.been.called;

      getModelOrCollectionForSpecStub.should.have.been.calledOnce;
      getModelOrCollectionForSpecStub.should.have.been.calledWith(spec, null, options);

      modelMock.fetch.should.have.been.calledOnce;

      done();
    });
  });
});
