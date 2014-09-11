var _ = require('underscore'),
    Backbone = require('backbone'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    should = chai.should(),
    syncer = require('../../shared/syncer'),
    BaseModel = require('../../shared/base/model'),
    App = require('../../shared/app');

chai.use(sinonChai);

describe('syncer', function() {

  describe('sync', function () {
    var model, options, app, request;

    beforeEach(function () {
      request = sinon.stub();
      app = new App();
      app.req = { dataAdapter: { request: request } };

      model = new BaseModel({ id: 0 }, { app: app });
      model.api = 'foo'
      options = {
        headers: { foo: 'bar' },
        data: { baz: { quux: 'doh' } }
      };
    });

    describe('serverSync', function () {
      describe('options.data', function () {
        beforeEach(function () {
          model.urlRoot = '/:baz/listings';
        });

        it('should not directly modify the same object in memory as the model/collection params', function () {
          model.params = options.data; // mimics the line in the base collection 'fetch' method
          syncer.clientSync.call(model, 'read', model, options);
          model.params.should.deep.equal({ baz: { quux: 'doh' } })
        });
      });

      context('when urlRoot is used on the model', function () {
        beforeEach(function () {
          model.urlRoot = '/listings';
        });

        it('should send a GET request with the configured dataAdapter', function () {
          var expectedRequestOptions = {
            method: 'GET',
            path: '/listings/0',
            query: { baz: { quux: 'doh' } },
            headers: { foo: 'bar' },
            api: 'foo',
            body: {}
          };

          syncer.serverSync.call(model, 'read', model, options);

          request.should.have.been.calledOnce;
          request.should.have.been.calledWith(model.app.req, expectedRequestOptions)
        });

        it('should send the correct payload on PUT or POST requests', function () {
          var expectedRequestOptions = {
            method: 'PUT',
            path: '/listings/0',
            query: { baz: { quux: 'doh' } },
            headers: { foo: 'bar' },
            api: 'foo',
            body: { id: 0, foo: 'bar', bar: 'foo' }
          };

          model.set('foo', 'bar');
          model.set('bar', 'foo');

          syncer.serverSync.call(model, 'update', model, options);

          request.should.have.been.calledOnce;
          request.should.have.been.calledWith(model.app.req, expectedRequestOptions)
        });
      });

      context('when url is explicitly defined on the model', function () {
        context('when the url does not include query params', function () {
          beforeEach(function () {
            model.url = '/listings/:id';
          });

          it('should send a GET request with the configured dataAdapter', function () {
            var expectedRequestOptions = {
              method: 'GET',
              path: '/listings/0',
              query: { baz: { quux: 'doh' } },
              headers: { foo: 'bar' },
              api: 'foo',
              body: {}
            };

            syncer.serverSync.call(model, 'read', model, options);

            request.should.have.been.calledOnce;
            request.should.have.been.calledWith(model.app.req, expectedRequestOptions)
          });

          it('should send the correct payload on PUT or POST requests', function () {
            var expectedRequestOptions = {
              method: 'PUT',
              path: '/listings/0',
              query: { baz: { quux: 'doh' } },
              headers: { foo: 'bar' },
              api: 'foo',
              body: { id: 0, foo: 'bar', bar: 'foo' }
            };

            model.set('foo', 'bar');
            model.set('bar', 'foo');

            syncer.serverSync.call(model, 'update', model, options);

            request.should.have.been.calledOnce;
            request.should.have.been.calledWith(model.app.req, expectedRequestOptions)
          });
        });

        context('when the url includes query params', function () {
          beforeEach(function () {
            model.url = '/listings?context=show';
          });

          it('should send a GET request with the configured dataAdapter', function () {
            var expectedRequestOptions = {
              method: 'GET',
              path: '/listings',
              query: { baz: { quux: 'doh' }, context: 'show' },
              headers: { foo: 'bar' },
              api: 'foo',
              body: {}
            };

            syncer.serverSync.call(model, 'read', model, options);

            request.should.have.been.calledOnce;
            request.should.have.been.calledWith(model.app.req, expectedRequestOptions)
          });

          it('should send the correct payload on PUT or POST requests', function () {
            var expectedRequestOptions = {
              method: 'PUT',
              path: '/listings',
              query: { baz: { quux: 'doh' }, context: 'show' },
              headers: { foo: 'bar' },
              api: 'foo',
              body: { id: 0, foo: 'bar', bar: 'foo' }
            };

            model.set('foo', 'bar');
            model.set('bar', 'foo');

            syncer.serverSync.call(model, 'update', model, options);

            request.should.have.been.calledOnce;
            request.should.have.been.calledWith(model.app.req, expectedRequestOptions)
          });
        });

      });
    });

    describe('clientSync', function () {
      var backboneSync, syncErrorHandler;

      beforeEach(function () {
        backboneSync = sinon.stub(Backbone, 'sync');
        syncErrorHandler = sinon.spy();
      });

      afterEach(function () {
        backboneSync.restore();
      });

      describe('options.data', function () {
        beforeEach(function () {
          model.urlRoot = '/:baz/listings';
        });

        it('should not directly modify the same object in memory as the model/collection params', function () {
          model.params = options.data; // to mimic the line in the base collection 'fetch' method
          syncer.clientSync.call(model, 'read', model, options);
          model.params.should.deep.equal({ baz: { quux: 'doh' } })
        });

        it('should not create an options.data property if it is initially undefined', function () {
          // Important because Backbone.sync uses Backbone.ajax(_.extend(params, options)), so if
          // options.hasOwnProperty('data') === true, it will override params.data even if options.data is undefined
          var firstInvocation, lastArgument;
          delete options.data;
          syncer.clientSync.call(model, 'read', model, options);
          firstInvocation = _.first(backboneSync.args);
          optionsArg = _.last(firstInvocation);

          optionsArg.hasOwnProperty('data').should.be.false
        });
      });

      context('when urlRoot is used on the model', function () {
        beforeEach(function () {
          model.urlRoot = '/listings';
        });

        it('should call Backbone.sync', function () {
          syncer.clientSync.call(model, 'read', model, options);

          backboneSync.should.have.been.calledOnce;
          // Don't need to verify the options because they will be modified.
          // Test for the modification is lower.
          backboneSync.should.have.been.calledWith('read', model);
        });

        it('should get the prefixed API url', function () {
          var expectedOptions = {
            url: '/api/' + model.api + '/-' + model.url(),
            headers: { foo: 'bar' },
            data: { baz: { quux: 'doh' } }
          };

          syncer.clientSync.call(model, 'read', model, options);
          backboneSync.should.have.been.calledWithExactly('read', model, expectedOptions);
        });

        it('should wrap the error handler', function () {
          options.error = syncErrorHandler;

          syncer.clientSync.call(model, 'read', model, options);

          var error = backboneSync.lastCall.args[2].error;
          syncErrorHandler.should.be.not.equal(error);
          error.should.be.a('function');
          error.should.have.length(1);
        });

        describe('wrappedErrorHandler', function () {
          var fakeXhr;

          beforeEach(function () {
            fakeXhr = {
              responseText: '{"foo": "bar"}',
              status: 418,
              getResponseHeader: sinon.stub()
            };
            options.error = syncErrorHandler;
            backboneSync.yieldsTo('error', fakeXhr);
          });

          it('should call the original error handler with status and body', function () {
            var expectedResponse = {
              body: fakeXhr.responseText,
              status: fakeXhr.status
            };

            syncer.clientSync.call(model, 'read', model, options);

            syncErrorHandler.should.have.been.calledOnce;
            syncErrorHandler.should.have.been.calledWithExactly(expectedResponse);
          });

          it('should parse the payload if content-type is "application/json"', function () {
            var expectedResponse = {
              body: JSON.parse(fakeXhr.responseText),
              status: fakeXhr.status
            };

            fakeXhr.getResponseHeader.withArgs('content-type').returns('application/json');

            syncer.clientSync.call(model, 'read', model, options);

            syncErrorHandler.should.have.been.calledOnce;
            syncErrorHandler.should.have.been.calledWithExactly(expectedResponse);
          });
        });
      });

      context('when url is explicitly defined on the model', function () {
        context('when the url does not include query params', function () {
          beforeEach(function () {
            model.url = '/listings/:id';
          });

          it('should call Backbone.sync', function () {
            syncer.clientSync.call(model, 'read', model, options);

            backboneSync.should.have.been.calledOnce;
            // Don't need to verify the options because they will be modified.
            // Test for the modification is lower.
            backboneSync.should.have.been.calledWith('read', model);
          });

          it('should get the prefixed API url', function () {
            var expectedOptions = {
              url: '/api/' + model.api + '/-' +
                syncer.interpolateParams(model, model.url, { id: model[model.idAttribute] }),
              headers: { foo: 'bar' },
              data: { baz: { quux: 'doh' } }
            };

            syncer.clientSync.call(model, 'read', model, options);
            backboneSync.should.have.been.calledWithExactly('read', model, expectedOptions);
          });

          it('should wrap the error handler', function () {
            options.error = syncErrorHandler;

            syncer.clientSync.call(model, 'read', model, options);

            var error = backboneSync.lastCall.args[2].error;
            syncErrorHandler.should.be.not.equal(error);
            error.should.be.a('function');
            error.should.have.length(1);
          });

          describe('wrappedErrorHandler', function () {
            var fakeXhr;

            beforeEach(function () {
              fakeXhr = {
                responseText: '{"foo": "bar"}',
                status: 418,
                getResponseHeader: sinon.stub()
              };
              options.error = syncErrorHandler;
              backboneSync.yieldsTo('error', fakeXhr);
            });

            it('should call the original error handler with status and body', function () {
              var expectedResponse = {
                body: fakeXhr.responseText,
                status: fakeXhr.status
              };

              syncer.clientSync.call(model, 'read', model, options);

              syncErrorHandler.should.have.been.calledOnce;
              syncErrorHandler.should.have.been.calledWithExactly(expectedResponse);
            });

            it('should parse the payload if content-type is "application/json"', function () {
              var expectedResponse = {
                body: JSON.parse(fakeXhr.responseText),
                status: fakeXhr.status
              };

              fakeXhr.getResponseHeader.withArgs('content-type').returns('application/json');

              syncer.clientSync.call(model, 'read', model, options);

              syncErrorHandler.should.have.been.calledOnce;
              syncErrorHandler.should.have.been.calledWithExactly(expectedResponse);
            });
          });
        });

        context('when the url includes query params', function () {
          beforeEach(function () {
            model.url = '/listings?context=show';
          });

          it('should call Backbone.sync', function () {
            syncer.clientSync.call(model, 'read', model, options);

            backboneSync.should.have.been.calledOnce;
            // Don't need to verify the options because they will be modified.
            // Test for the modification is lower.
            backboneSync.should.have.been.calledWith('read', model);
          });

          it('should get the prefixed API url', function () {
            var expectedOptions = {
              url: '/api/' + model.api + '/-' + model.url,
              headers: { foo: 'bar' },
              data: { baz: { quux: 'doh' } }
            };

            syncer.clientSync.call(model, 'read', model, options);
            backboneSync.should.have.been.calledWithExactly('read', model, expectedOptions);
          });
        });
      });
    });
  });

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
    beforeEach(function() {
      var app = new App;
      this.model = new BaseModel({}, {app: app});
    });

    it("should support default api", function() {
      this.model.formatClientUrl('/path/to/resource').should.eql('/api/-/path/to/resource');
    });

    it("should support specifying an api", function() {
      this.model.formatClientUrl('/path/to/resource', 'api-name').should.eql('/api/api-name/-/path/to/resource');
    });

    it("should support custom apiPath", function() {
      this.model.app.set('apiPath', '/foo/bar');
      this.model.formatClientUrl('/path/to/resource').should.eql('/foo/bar/-/path/to/resource');
    });
  });

});
