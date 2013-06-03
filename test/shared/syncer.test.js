var Backbone, should, syncer, _;

syncer = require('../../shared/syncer');
_ = require('underscore');
Backbone = require('backbone');
should = require('should');

describe('syncer', function() {

  describe('interpolateParams', function() {
    beforeEach(function() {
      this.model = new Backbone.Model({
        id: 42
      });
    });

    it('should interpolate params', function() {
      var url;

      url = syncer.interpolateParams(this.model, '/listings/:id');
      url.should.equal('/listings/42');
    });
    it('should interpolate the same param multiple times', function() {
      var url;

      url = syncer.interpolateParams(this.model, '/special/:id/url/:id');
      url.should.equal('/special/42/url/42');
    });

    it('should delete any interpolated properties from an optional params hash', function() {
      var params, url;

      params = {
        id: 42,
        foo: 'bar'
      };
      url = syncer.interpolateParams(this.model, '/listings/:id', params);
      url.should.equal('/listings/42');
      params.should.eql({
        foo: 'bar'
      });
    });
  });

  describe('objectsDiffer', function() {

    describe('flat objects', function() {
      beforeEach(function() {
        this.obj1 = {
          foo: 'bar1',
          baz: 'bam1'
        };
        this.obj2 = _.clone(this.obj1);
      });

      it("should assert equality", function() {
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.false;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.false;
      });

      it("should work for string values", function() {
        this.obj2.foo = 'xxx';
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.true;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.true;
      });

      it("should work for comparing obj to null", function() {
        this.obj2.foo = null;
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.true;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.true;
      });

      it("should work for comparing obj to non-existant value", function() {
        this.obj2.other = 'something';
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.true;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.true;
      });
    });

    describe('nested objects', function() {
      beforeEach(function() {
        this.obj1 = {
          foo: 'bar1',
          subobj: {
            nil: null,
            bool: true,
            obj: {
              harder: 'faster'
            }
          },
          arr: [1, 2, 3]
        };
        this.obj2 = _.clone(this.obj1);
      });

      it("should assert equality", function() {
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.false;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.false;
      });
    });

    describe('arrays', function() {
      it("should be equal if empty", function() {
        this.obj1 = [];
        this.obj2 = [];
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.false;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.false;
      });

      it("should be equal if non-empty", function() {
        this.obj1 = [1, 2, 3];
        this.obj2 = [1, 2, 3];
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.false;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.false;
      });

      it("should not be equal if different order", function() {
        this.obj1 = [1, 2, 3];
        this.obj2 = [1, 3, 2];
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.true;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.true;
      });

      it("should not be equal if different values", function() {
        this.obj1 = [1, 2, 3];
        this.obj2 = [1, 2];
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.true;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.true;
        this.obj1 = [];
        this.obj2 = [1, 3, 2];
        syncer.objectsDiffer(this.obj1, this.obj2).should.be.true;
        syncer.objectsDiffer(this.obj2, this.obj1).should.be.true;
      });
    });
  });

  describe('getUrl', function() {
    it("should support absolute URIs", function() {
      // HTTP
      syncer.getUrl('http://www.example.com/api/foo', true, {}).should.eql('http://www.example.com/api/foo');

      // HTTPS
      syncer.getUrl('https://www.example.com/api/foo', true, {}).should.eql('https://www.example.com/api/foo');
    });

    it("should support absolute URI with port", function() {
      syncer.getUrl('http://www.example.com:8080/api/foo').should.eql('http://www.example.com:8080/api/foo');
    });
  });

  describe('formatClientUrl', function() {
    it("should support default api", function() {
      syncer.formatClientUrl('/path/to/resource').should.eql('/api/-/path/to/resource');
    });

    it("should support specifying an api", function() {
      syncer.formatClientUrl('/path/to/resource', 'api-name').should.eql('/api/api-name/-/path/to/resource');
    });
  });

});
