require('../../shared/globals')
fetcher = require('../../shared/fetcher')
should = require('should')

modelUtils = require('../../shared/model_utils')
BaseModel = require('../../shared/base/model')
BaseCollection = require('../../shared/base/collection')

listingResponses =
  1:
    id: 1
    name: 'Fetching!'
  2:
    id: 2
    name: 'Fetching!'
    city: 'San Francisco'

class Listing extends BaseModel
  fetch: (options) ->
    id = options.data.id
    resp = listingResponses[id]
    @set resp
    options.success(this, resp)

class Listings extends BaseCollection

modelUtils.addClassMapping 'Listing', Listing
modelUtils.addClassMapping 'Listings', Listings

describe 'fetcher', ->

  describe 'hydrate', ->

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


    it "should be able to fetch a model", (done) ->
      fetchSpec =
        model:
          model: 'Listing'
          params:
            id: 1
      fetcher.fetch fetchSpec, (err, results) ->
        done(err) if err
        results.model.should.be.an.instanceOf(Listing)
        results.model.toJSON().should.eql({id: 1, name: 'Fetching!'})
        done()


