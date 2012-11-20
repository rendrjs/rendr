require('../../shared/globals')
fetcher = require('../../shared/fetcher')
should = require('should')

modelUtils = require('../../shared/model_utils')
BaseModel = require('../../shared/base/model')
BaseCollection = require('../../shared/base/collection')

listingResponses =
  basic:
    name: 'Fetching!'
  full:
    name: 'Fetching!'
    city: 'San Francisco'

class Listing extends BaseModel
  fetch: (options) ->
    resp = getModelResponse('full', options.data.id)
    @set resp
    options.success(this, resp)

class Listings extends BaseCollection
  model: Listing

  fetch: (options) ->
    resp = buildCollectionResponse()
    @reset resp
    options.success(this, resp)

getModelResponse = (version, id) ->
  _.extend {}, listingResponses[version], {id}

buildCollectionResponse = ->
  [1..5].map (id) -> getModelResponse('basic', id)

modelUtils.addClassMapping 'Listing', Listing
modelUtils.addClassMapping 'Listings', Listings

describe 'fetcher', ->

  describe 'hydrate', ->

    beforeEach ->
      fetcher.modelStore.clear()

    it "should be able store and hydrate a model", ->
      rawListing = {id: 9, name: 'Sunny'}
      results =
        listing: new Listing(rawListing)
      fetchSummary =
        listing: { model: 'listing', id: 9 }
      fetcher.storeModels results, fetchSummary
      hydrated = fetcher.hydrate fetchSummary
      listing = hydrated.listing
      listing.should.be.an.instanceOf Listing
      should.deepEqual listing.toJSON(), rawListing

    it "should be able to store and hydrate a collection", ->
      rawListings = [{id: 1, name: 'Sunny'}, {id: 3, name: 'Cloudy'}, {id: 99, name: 'Tall'}]
      results =
        listings: new Listings(rawListings)
      fetchSummary =
        listings: { collection: 'listings', ids: [1,3,99] }
      fetcher.storeModels results, fetchSummary
      hydrated = fetcher.hydrate fetchSummary
      listings = hydrated.listings
      listings.should.be.an.instanceOf Listings
      should.deepEqual listings.toJSON(), rawListings

    it "should be able to hydrate multiple objects at once", ->
      rawListing = {id: 9, name: 'Sunny'}
      rawListings = [{id: 1, name: 'Sunny'}, {id: 3, name: 'Cloudy'}, {id: 99, name: 'Tall'}]
      results =
        listing: new Listing(rawListing)
        listings: new Listings(rawListings)
      fetchSummary =
        listing: { model: 'listing', id: 9 }
        listings: { collection: 'listings', ids: [1,3,99] }
      fetcher.storeModels results, fetchSummary
      hydrated = fetcher.hydrate fetchSummary
      listing = hydrated.listing
      listing.should.be.an.instanceOf Listing
      should.deepEqual listing.toJSON(), rawListing

      listings = hydrated.listings
      listings.should.be.an.instanceOf Listings
      should.deepEqual listings.toJSON(), rawListings


  describe 'fetch', ->

    beforeEach ->
      fetcher.modelStore.clear()

    it "should be able to fetch a model", (done) ->
      fetchSpec =
        model: { model: 'Listing', params: { id: 1 } }
      fetcher.fetch fetchSpec, (err, results) ->
        done(err) if err
        results.model.should.be.an.instanceOf(Listing)
        results.model.toJSON().should.eql(getModelResponse('full', 1))
        done()

    it "should be able to fetch a collection", (done) ->
      fetchSpec =
        collection: { collection: 'Listings' }
      fetcher.fetch fetchSpec, (err, results) ->
        done(err) if err
        results.collection.should.be.an.instanceOf(Listings)
        results.collection.toJSON().should.eql(buildCollectionResponse())
        done()

    it "should be able to re-fetch if already exists but is missing key", (done) ->
      # First, fetch the collection, which has smaller versions of the models.
      fetchSpec =
        collection: { collection: 'Listings' }
      fetcher.fetch fetchSpec, {writeToCache: true}, (err, results) ->
        done(err) if err
        results.collection.toJSON().should.eql(buildCollectionResponse())

        # Make sure that the basic version is stored in modelStore.
        fetcher.modelStore.get('Listing', 1).toJSON().should.eql getModelResponse('basic', 1)

        # Then, fetch the single model, which should be cached.
        fetchSpec =
          model: { model: 'Listing', params: { id: 1 } }
        fetcher.fetch fetchSpec, {readFromCache: true}, (err, results) ->
          done(err) if err
          results.model.toJSON().should.eql(getModelResponse('basic', 1))

          # Finally, fetch the single model, but specifiy that certain key must be present.
          fetchSpec =
            model: { model: 'Listing', params: { id: 1 }, ensureKeys: ['city'] }
          fetcher.fetch fetchSpec, {readFromCache: true}, (err, results) ->
            done(err) if err
            results.model.toJSON().should.eql(getModelResponse('full', 1))
            done()

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
