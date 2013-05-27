var _ = require('underscore'),
    utils = require('./../../server/utils'),
    should = require('should'),
    path = require('path');

describe('utils', function() {

  describe('getApiHost', function() {
    beforeEach(function() {
      this.apiHostsMap = {
        'foo_host': [ '/foo/:id', '/baz/:boom'],
        'bar_host': [ '/new/:name/:id', '/a/perfect/match'],
        'baz_host': [ '/:totally/mixing/:it/up/:here', '/a/perfect/match/again']
      };
    });

    it('should return the correct apiHost if a perfect match is found', function() {
      utils.getApiHost('/a/perfect/match', this.apiHostsMap).should.eql('bar_host');
      utils.getApiHost('/a/perfect/match/again', this.apiHostsMap).should.eql('baz_host');
    });

    it('should return the correct apiHost if a query string is present', function() {
      utils.getApiHost('/foo/123?thing=true&cows=moo', this.apiHostsMap).should.eql('foo_host');
    });

    it('should return the correct apiHost if one or multiple params are present', function() {
      utils.getApiHost('/baz/boom', this.apiHostsMap).should.eql('foo_host');
      utils.getApiHost('/new/guy/12', this.apiHostsMap).should.eql('bar_host');
      utils.getApiHost('/ilike/mixing/drinks/up/inhere', this.apiHostsMap).should.eql('baz_host');
    });

  });

});