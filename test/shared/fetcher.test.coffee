require('../../shared/globals')
should = require('should')

modelUtils = require('../../shared/modelUtils')
BaseModel = require('../../shared/base/model')
BaseCollection = require('../../shared/base/collection')
App = require('../../shared/app')
fetcher = null

listingResponses =
  basic:
    name: 'Fetching!'
  full:
    name: 'Fetching!'
    city: 'San Francisco'

class Listing extends BaseModel
  jsonKey: 'listing'

  fetch: (options) ->
    resp = getModelResponse('full', options.data.id, true)
    setTimeout =>
      parsed = @parse(resp)
      @set(parsed)
      options.success(this, parsed)
    , 1

class Listings extends BaseCollection
  model: Listing
  jsonKey: 'listings'

  fetch: (options) ->
    resp = buildCollectionResponse(true)
    if options.data?
      resp.meta = options.data
    setTimeout =>
      parsed = @parse(resp)
      @reset(parsed.map (attrs) => new @model(attrs, parse: true))
      options.success(this, parsed)
    , 1

getModelResponse = (version, id, addJsonKey = false) ->
  resp = _.extend({}, listingResponses[version], {id})
  if addJsonKey
    _.tap {}, (obj) ->
      obj.listing = resp
  else
    resp

buildCollectionResponse = (addJsonKey = false) ->
  resp = [1..5].map (id) -> getModelResponse('basic', id, addJsonKey)
  if addJsonKey
    _.tap {}, (obj) ->
      obj.listings = resp
  else
    resp

modelUtils.addClassMapping 'Listing', Listing
modelUtils.addClassMapping 'Listings', Listings

describe 'fetcher', ->

  beforeEach ->
    @app = new App
    fetcher = @app.fetcher

  describe 'hydrate', ->

    beforeEach ->
      fetcher.modelStore.clear()
      fetcher.collectionStore.clear()

    it "should be able store and hydrate a model", ->
      rawListing = {id: 9, name: 'Sunny'}
      results =
        listing: new Listing(rawListing, {@app})
      fetchSummary =
        listing: { model: 'listing', id: 9 }
      fetcher.storeResults results
      hydrated = fetcher.hydrate fetchSummary
      listing = hydrated.listing
      listing.should.be.an.instanceOf Listing
      listing.toJSON().should.eql rawListing

    it "should be able to store and hydrate a collection", ->
      rawListings = [{id: 1, name: 'Sunny'}, {id: 3, name: 'Cloudy'}, {id: 99, name: 'Tall'}]
      params =
        items_per_page: 99
      results =
        listings: new Listings(rawListings, {params, @app})
      fetchSummary =
        listings: { collection: 'listings', ids: _.pluck(rawListings, 'id'), params: params }
      fetcher.storeResults results
      hydrated = fetcher.hydrate fetchSummary
      listings = hydrated.listings
      listings.should.be.an.instanceOf Listings
      listings.toJSON().should.eql rawListings
      listings.params.should.eql params

      should.not.exist fetcher.collectionStore.get('Listings', {})
      fetcher.collectionStore.get('Listings', params).should.eql
        ids: listings.pluck('id')
        meta: {}

    it "should be able to hydrate multiple objects at once", ->
      rawListing = {id: 9, name: 'Sunny'}
      rawListings = [{id: 1, name: 'Sunny'}, {id: 3, name: 'Cloudy'}, {id: 99, name: 'Tall'}]
      results =
        listing: new Listing(rawListing, {@app})
        listings: new Listings(rawListings, {@app})
      fetchSummary =
        listing: { model: 'listing', id: 9 }
        listings: { collection: 'listings', ids: [1,3,99] }
      fetcher.storeResults results
      hydrated = fetcher.hydrate fetchSummary
      listing = hydrated.listing
      listing.should.be.an.instanceOf Listing
      should.deepEqual listing.toJSON(), rawListing

      listings = hydrated.listings
      listings.should.be.an.instanceOf Listings
      should.deepEqual listings.toJSON(), rawListings

    it "should inject the app instance", ->
      listing1 = new Listing(id: 1)
      fetcher.modelStore.set(listing1)

      summaries =
        model:
          id: 1
          model: 'Listing'

      app =
        fake: 'app'

      results = fetcher.hydrate(summaries, app: app)
      model = results.model
      model.app.should.eql(app)

  describe 'fetch', ->

    beforeEach ->
      fetcher.modelStore.clear()
      fetcher.collectionStore.clear()
      fetcher.off(null, null)

    it "should be able to fetch a model", (done) ->
      fetchSpec =
        model: { model: 'Listing', params: { id: 1 } }
      fetcher.pendingFetches.should.eql 0
      fetcher.fetch fetchSpec, (err, results) ->
        fetcher.pendingFetches.should.eql 0
        return done(err) if err
        results.model.should.be.an.instanceOf(Listing)
        results.model.toJSON().should.eql(getModelResponse('full', 1))
        done()
      fetcher.pendingFetches.should.eql 1

    it "should be able to fetch a collection", (done) ->
      fetchSpec =
        collection: { collection: 'Listings' }
      fetcher.pendingFetches.should.eql 0
      fetcher.fetch fetchSpec, (err, results) ->
        fetcher.pendingFetches.should.eql 0
        return done(err) if err
        results.collection.should.be.an.instanceOf(Listings)
        results.collection.toJSON().should.eql(buildCollectionResponse())
        done()
      fetcher.pendingFetches.should.eql 1

    it "should be able to fetch both a model and a collection at the same time", (done) ->
      fetchSpec =
        model: { model: 'Listing', params: { id: 1 } }
        collection: { collection: 'Listings' }
      fetcher.pendingFetches.should.eql 0
      fetcher.fetch fetchSpec, (err, results) ->
        fetcher.pendingFetches.should.eql 0
        return done(err) if err
        results.model.should.be.an.instanceOf(Listing)
        results.model.toJSON().should.eql(getModelResponse('full', 1))
        results.collection.should.be.an.instanceOf(Listings)
        results.collection.toJSON().should.eql(buildCollectionResponse())
        done()
      fetcher.pendingFetches.should.eql 1

    it "should be able to fetch models from cache with custom idAttribute", (done) ->
      class User extends BaseModel
        idAttribute: 'login'
      userAttrs =
        login: 'someperson'
        name: 'Some Person'
      someperson = new User(userAttrs)
      modelUtils.addClassMapping 'user', User
      fetcher.modelStore.set(someperson)
      fetchSpec =
        model: { model: 'user', params: { login: 'someperson' } }

      fetcher.fetch fetchSpec, {readFromCache: true}, (err, results) ->
        return done(err) if err
        results.model.should.be.an.instanceOf(User)
        results.model.toJSON().should.eql(userAttrs)
        done()

    it "should be able to re-fetch if already exists but is missing key", (done) ->
      # First, fetch the collection, which has smaller versions of the models.
      fetchSpec =
        collection: { collection: 'Listings' }
      fetcher.fetch fetchSpec, {writeToCache: true}, (err, results) ->
        return done(err) if err
        results.collection.toJSON().should.eql(buildCollectionResponse())

        # Make sure that the basic version is stored in modelStore.
        fetcher.modelStore.get('Listing', 1).should.eql getModelResponse('basic', 1)

        # Then, fetch the single model, which should be cached.
        fetchSpec =
          model: { model: 'Listing', params: { id: 1 } }
        fetcher.fetch fetchSpec, {readFromCache: true}, (err, results) ->
          return done(err) if err
          results.model.toJSON().should.eql(getModelResponse('basic', 1))

          # Finally, fetch the single model, but specifiy that certain key must be present.
          fetchSpec =
            model: { model: 'Listing', params: { id: 1 }, ensureKeys: ['city'] }
          fetcher.fetch fetchSpec, {readFromCache: true}, (err, results) ->
            return done(err) if err
            results.model.toJSON().should.eql(getModelResponse('full', 1))
            done()

    it "should emit events", (done) ->
      startEmitted = false
      endEmitted = false

      fetcher.on 'fetch:start', (eventFetchSpec) ->
        startEmitted = true
        eventFetchSpec.should.eql fetchSpec

      fetcher.on 'fetch:end', (eventFetchSpec) ->
        endEmitted = true
        eventFetchSpec.should.eql fetchSpec

      fetchSpec =
        model: { model: 'Listing', params: { id: 1 } }

      fetcher.fetch fetchSpec, (err, results) ->
        startEmitted.should.be.true
        endEmitted.should.be.true
        done(err) if err
        results.model.should.be.an.instanceOf(Listing)
        results.model.toJSON().should.eql(getModelResponse('full', 1))
        done()

      startEmitted.should.be.true
      endEmitted.should.be.false

  describe 'isMissingKeys', ->
    before ->
      @modelData =
        id: 1
        name: 'foobar'

    it "should be false if keys not passed in", ->
      fetcher.isMissingKeys(@modelData, undefined).should.be.false
      fetcher.isMissingKeys(@modelData, []).should.be.false

    it "should be false if keys passed in but are present", ->
      fetcher.isMissingKeys(@modelData, 'name').should.be.false
      fetcher.isMissingKeys(@modelData, ['name']).should.be.false
      fetcher.isMissingKeys(@modelData, ['id', 'name']).should.be.false

    it "should be true if keys passed in are not present", ->
      fetcher.isMissingKeys(@modelData, 'city').should.be.true
      fetcher.isMissingKeys(@modelData, ['city']).should.be.true
      fetcher.isMissingKeys(@modelData, ['id', 'city']).should.be.true

  describe 'summarize', ->

    it "should summarize a model", ->
      attrs =
        id: 1234
        blahblah: 'boomtown'
      model = new Listing(attrs)
      summary = fetcher.summarize(model)

      summary.model.should.eql 'listing'
      summary.id.should.eql attrs.id

    it "should support custom idAttribute", ->
      attrs =
        login: 'joeschmo'
        blahblah: 'boomtown'

      class CustomListing extends Listing
        idAttribute: 'login'

      model = new CustomListing(attrs)
      summary = fetcher.summarize(model)

      summary.model.should.eql 'custom_listing'
      summary.id.should.eql attrs.login

    it "should summarize a collection", ->
      models = [{
        id: 1
        name: 'foo'
      }, {
        id: 2
        name: 'bar'
      }]
      params =
        some: 'key'
        other: 'value'
      meta =
        the: 'one'
        foo: 'butt'
      collection = new Listings(models, {params, meta})
      summary = fetcher.summarize(collection)

      summary.collection.should.eql 'listings'
      summary.ids.should.eql [1,2]
      summary.params.should.eql params
      summary.meta.should.eql meta

  describe 'checkFresh', ->

    describe 'didCheckFresh', ->

      beforeEach ->
        fetcher.checkedFreshTimestamps = {}
        @spec =
          model: 'foobutt'
          params: {}

      it "should store it properly", ->
        fetcher.didCheckFresh(@spec)
        key = fetcher.checkedFreshKey(@spec)

        fetcher.checkedFreshTimestamps[key].should.be.ok

    describe 'shouldCheckFresh', ->

      beforeEach ->
        fetcher.checkedFreshTimestamps = {}
        @spec =
          model: 'foobutt'
          params: {}

      it "should return true if timestamp doesn't exist", ->
        fetcher.shouldCheckFresh(@spec).should.be.true

      it "should return true if timestamp exists and is greater than 'checkedFreshRate' ago", ->
        key = fetcher.checkedFreshKey(@spec)
        now = new Date().getTime()
        fetcher.checkedFreshTimestamps[key] = now - fetcher.checkedFreshRate - 1000
        fetcher.shouldCheckFresh(@spec).should.be.true

      it "should return false if timestamp exists and is less than 'checkedFreshRate' ago", ->
        key = fetcher.checkedFreshKey(@spec)
        now = new Date().getTime()
        fetcher.checkedFreshTimestamps[key] = now - 1
        fetcher.shouldCheckFresh(@spec).should.be.false


