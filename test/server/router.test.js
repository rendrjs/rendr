/*global describe, it, beforeEach */

var chai = require('chai'),
    should = chai.should(),
    Router = require('../../server/router'),
    express = require('express'),
    _ = require('underscore'),
    sinon = require('sinon');

chai.use(require('sinon-chai'));

var config = {
  paths: {
    entryPath: __dirname + "/../fixtures/"
  }
};

function shouldMatchRoute(actual, expected) {
  actual.should.be.an.instanceOf(Array);
  actual.slice(0, 2).should.eql(expected);
  actual[2].should.be.an.instanceOf(Function);
}

describe("server/router", function() {
  var router;

  beforeEach(function() {
    router = this.router = new Router(config);
  });

  describe('getHeadersForRoute', function () {
    it('should return an empty object', function () {
      var headers = this.router.getHeadersForRoute({});
      headers.should.deep.equal({});
    });

    it('should set the Cache-Control header if maxAge is given', function () {
      var maxAge = 1000,
        headers = this.router.getHeadersForRoute({maxAge: maxAge}),
        expectedHeaders = {
          'Cache-Control': 'public, max-age=' + maxAge
        };

      headers.should.deep.equal(expectedHeaders);
    })
  });

  describe("route", function() {
    it("should add basic route definitions", function() {
      var route = this.router.route("test", "test#index");
      shouldMatchRoute(route, [
        '/test', {
          controller: 'test',
          action: 'index'
        }
      ]);
    });

    it("should support leading slash in pattern", function() {
      var route = this.router.route("/test", "test#index");
      return shouldMatchRoute(route, [
        '/test', {
          controller: 'test',
          action: 'index'
        }
      ]);
    });

    it("should support RegExp route definitions", function() {
      var routeRegex = /reg[ex]{2}ro(u|t)e?/,
          route = this.router.route(routeRegex, "test#index");
      shouldMatchRoute(route, [
        routeRegex, {
          controller: 'test',
          action: 'index'
        }
      ]);
    });

    it("should support object as second argument", function() {
      var route = this.router.route("/test", {
        controller: 'test',
        action: 'index',
        role: 'admin'
      });
      shouldMatchRoute(route, [
        '/test', {
          controller: 'test',
          action: 'index',
          role: 'admin'
        }
      ]);
    });

    it("should support string as second argument, object as third argument", function() {
      var route = this.router.route("/test", "test#index", {
        role: 'admin'
      });
      shouldMatchRoute(route, [
        '/test', {
          controller: 'test',
          action: 'index',
          role: 'admin'
        }
      ]);
    });

    it("should support `redirect` option", function() {
      var route = this.router.route("/test", {
        redirect: '/foo'
      });
      shouldMatchRoute(route, [
        '/test', {
          redirect: '/foo'
        }
      ]);
    });
  });

  describe("routes", function() {
    it("should return the aggregated routes", function() {
      var routes;

      this.router.route("users/:id", "users#show");
      routes = this.router.routes();
      routes.length.should.eql(1);
      shouldMatchRoute(routes[0], [
        '/users/:id', {
          controller: 'users',
          action: 'show'
        }
      ]);
      this.router.route("users/login", "users#login");
      routes = this.router.routes();
      routes.length.should.eql(2);
      shouldMatchRoute(routes[0], [
        '/users/:id', {
          controller: 'users',
          action: 'show'
        }
      ]);
      shouldMatchRoute(routes[1], [
        '/users/login', {
          controller: 'users',
          action: 'login'
        }
      ]);
    });

    it("should return a copy of the routes, not a reference", function() {
      var routes;

      this.router.route("users/:id", "users#show");
      routes = this.router.routes();

      // Modify the routes array
      routes.push('foo');
      this.router.routes().length.should.eql(1);

      // Also modify an individual route element
      this.router.routes()[0].length.should.eql(3);
      this.router.routes()[0].shift();
      this.router.routes()[0].length.should.eql(3);
    });

    it("should not throw error without routes", function() {
      this.router.routes().length.should.eql(0);
    });
  });

  describe("buildRoutes", function() {
    it("should build route definitions based on routes file", function() {
      var routes;

      this.router.buildRoutes();
      routes = this.router.routes();
      routes.length.should.eql(4);
      shouldMatchRoute(routes[0], [
        '/users/login', {
          controller: 'users',
          action: 'login'
        }
      ]);
      shouldMatchRoute(routes[1], [
        '/users/:id', {
          controller: 'users',
          action: 'show'
        }
      ]);
      shouldMatchRoute(routes[2], [
        '/test', {
          controller: 'test',
          action: 'index'
        }
      ]);
      shouldMatchRoute(routes[3], [
         /^\/regexp\/(foo|bar)/, {
          controller: 'test',
          action: 'regexp'
        }
      ]);
    });
  });

  describe("match", function() {
    it('should throw if an url is given', function () {
      var url = 'http://www.example.com',
        expectedErrorMessage = 'Cannot match full URL: "' + url + '". Use pathname instead.',
        match = this.router.match.bind(this, url);

      match.should.throw(Error, expectedErrorMessage);
    });

    it("should return the route info for a matched path, no leading slash", function() {
      var route;

      this.router.route("/users/:id", "users#show");
      route = this.router.match('users/1234');
      shouldMatchRoute(route, [
        '/users/:id', {
          controller: 'users',
          action: 'show'
        }
      ]);
    });

    it("should return the route info for a matched path, with leading slash", function() {
      var route;

      this.router.route("/users/:id", "users#show");
      route = this.router.match('/users/1234');
      shouldMatchRoute(route, [
        '/users/:id', {
          controller: 'users',
          action: 'show'
        }
      ]);
    });

    it("should return null if no match", function() {
      should.not.exist(this.router.match('abcd1234xyz'));
    });

    it("should match in the right order", function() {
      var route;

      this.router.route("/users/login", "users#login");
      this.router.route("/users/:id", "users#show");
      route = this.router.match('users/thisisaparam');
      shouldMatchRoute(route, [
        '/users/:id', {
          controller: 'users',
          action: 'show'
        }
      ]);
      route = this.router.match('users/login');
      shouldMatchRoute(route, [
        '/users/login', {
          controller: 'users',
          action: 'login'
        }
      ]);
    });

    it("should match regexp routes", function() {
      var route;

      this.router.route(/^\/regexp\/(foo|bar)/, "test#regexp");

      route = this.router.match('/regexp/food');
      shouldMatchRoute(route, [
        /^\/regexp\/(foo|bar)/, {
          controller: 'test',
          action: 'regexp'
        }
      ]);

      route = this.router.match('/regexp/bart');
      shouldMatchRoute(route, [
        /^\/regexp\/(foo|bar)/, {
          controller: 'test',
          action: 'regexp'
        }
      ]);

      // No leading slash.
      route = this.router.match('regexp/foodie');
      shouldMatchRoute(route, [
        /^\/regexp\/(foo|bar)/, {
          controller: 'test',
          action: 'regexp'
        }
      ]);

      should.not.exist(this.router.match('/regexp/b'));
    });
  });

  describe("getParams", function() {
    beforeEach(function() {
      this.req = express.request;

      resetProperties(this.req, {
        query: {},
        route: {keys: [], params: {}, regexp: false},
      });
      this.router.getParams(this.req).should.eql({});
    });

    it("should return basic query params", function() {
      this.req.__defineGetter__('query', function() {
        return {foo: 'bar', bam: 'baz'};
      });
      this.router.getParams(this.req).should.eql({foo: 'bar', bam: 'baz'});
    });

    it("should support regex route params", function() {
      this.req.__defineGetter__('route', function() {
        return {
          regexp: true
        };
      });
      this.req.__defineGetter__('params', function() {
        return {
          '0': 'zero-value'
        };
      });
      this.router.getParams(this.req).should.eql({
        '0': 'zero-value'
      });
    });

    it("should support route params", function() {
      this.req.__defineGetter__('route', function() {
        return {
          keys: [{name: 'id'}, {name: 'login'}],
        };
      });
      this.req.__defineGetter__('params', function() {
        return {
          id: 'id-value',
          login: 'login-value'
        }
      });
      this.router.getParams(this.req).should.eql({
        id: 'id-value',
        login: 'login-value'
      });
    });

    it("should support both together", function() {
      this.req.__defineGetter__('query', function() {
        return {foo: 'bar', bam: 'baz'};
      });

      this.req.__defineGetter__('route', function() {
        return {
          keys: [{name: 'id'}, {name: 'login'}],
        };
      });
      this.req.__defineGetter__('params', function() {
        return {
          id: 'id-value',
          login: 'login-value'
        }
      });

      this.router.getParams(this.req).should.eql({
        foo: 'bar',
        bam: 'baz',
        id: 'id-value',
        login: 'login-value'
      });
    });

    describe('XSS sanitization', function() {
      it("sanitize param keys", function() {
        this.req.__defineGetter__('query', function() {
          return {'tricky<script>alert("foo")</script>': 'value'};
        });

        this.router.getParams(this.req).should.eql({
          'tricky': 'value'
        });
      });

      it("sanitize param values", function() {
        this.req.__defineGetter__('query', function() {
          return {foo: '<script>alert("foo")</script>sneaky'};
        });

        this.router.getParams(this.req).should.eql({
          foo: 'sneaky'
        });
      });

      it("recusively sanitizes nested objects", function() {
        this.req.__defineGetter__('query', function() {
          return {
            nested: {
              foo: '<script>alert("foo")</script>sneakyfoo',
              bar: '<script>alert("bar")</script>sneakybar',
            },
          };
        });

        this.router.getParams(this.req).should.eql({
          nested: {
            foo: 'sneakyfoo',
            bar: 'sneakybar',
          },
        });
      });
    });
  });

  describe("getHandler", function () {
    beforeEach(function () {
      var rendrApp = {},
          expressRoute = {
            keys: [ { name: 'id' } ]
          },
          params = { id: 1 };

      this.router = new Router(config);
      this.pattern = '/users/:id';
      this.regExpPattern = '/users/([0-9])';
      this.req = { route: expressRoute, params: params, rendrApp: rendrApp };
    });

    describe('route middleware', function () {
      it('should pass through an error', function () {
        var someError = new Error('some error'),
          action = sinon.stub().yields(someError),
          middleware = this.router.getHandler(action, this.pattern, {}),
          next = sinon.spy();

        middleware(this.req, {}, next);

        action.should.have.been.calledOnce;
        next.should.have.been.calledOnce;
        next.should.have.been.calledWithExactly(someError);
      });

      it('should redirect if a redirect path is given', function () {
        var middleware = this.router.getHandler(null, this.pattern, { controller: 'foo', action: 'index', redirect: '/foo' }),
          res = { redirect: sinon.spy() };

        middleware(this.req, res);

        res.redirect.should.have.been.calledOnce;
        res.redirect.should.have.been.calledWithExactly(301, '/foo');
      });

      it("should call the action with the correct context", function () {
        var rendrApp = this.req.rendrApp,
          rendrRoute = { controller: 'users', action: 'show' },
          res = { render: sinon.spy(), redirect: sinon.spy() },
          handler;

        handler = this.router.getHandler(function (params, callback) {
          params.should.eql({ id: '1' });
          this.currentRoute.should.equal(rendrRoute);
          this.app.should.equal(rendrApp);
          this.redirectTo.should.be.a('function');
          callback(null, 'template/path', { some: 'data' });
        }, this.pattern, rendrRoute);

        handler(this.req, res);

        res.render.should.have.been.calledOnce;
        res.render.should.have.been.calledWith('template/path', {
          locals: { some: 'data' },
          app: this.req.rendrApp,
          req: this.req
        });
      });

      describe('render', function () {
        var action, middleware, res, getHeadersForRoute, next;

        beforeEach(function () {
          next = sinon.stub();
          action = sinon.stub().yields();
          middleware = this.router.getHandler(action, this.pattern, {});
          res = { set: sinon.spy(), type: sinon.stub(), end: sinon.spy(), render: sinon.stub() };
          res.render.yields();
          res.type.returns(res);
          getHeadersForRoute = sinon.stub(this.router, 'getHeadersForRoute').returns({ 'Content-Type': 'image/jpeg' });
        });

        it('should set the headers', function () {
          middleware(this.req, res);

          res.set.should.have.been.calledOnce;
          res.set.should.have.been.calledWithExactly({ 'Content-Type': 'image/jpeg' });
        });

        it('should set the type to html', function () {
          middleware(this.req, res);

          res.type.should.have.been.calledOnce;
          res.type.should.have.been.calledWithExactly('html');
        });

        it('should call end with the html output', function () {
          res.render.yields(null, '<b>foo</b>');
          middleware(this.req, res);

          res.end.should.have.been.calledOnce;
          res.end.should.have.been.calledWithExactly('<b>foo</b>');
        });

        it('should pass through an error', function () {
          var error = new Error();
          res.render.yields(error);
          middleware(this.req, res, next);

          next.should.have.been.calledOnce;
          next.should.have.been.calledWithExactly(error);
        });
      });
    });

    it("should pass regex route groups to the params", function () {
      var rendrApp = this.req.rendrApp,
          rendrRoute = { controller: 'users', action: 'show' },
          res = { render: sinon.spy(), redirect: sinon.spy() },
          regExpExpressRoute = {regexp: true, params: {'0' : '1'}},
          req = { route: regExpExpressRoute, params: { '0': '1' }, rendrApp: this.req.rendrApp },
          handler;

        handler = this.router.getHandler(function (params, callback) {
          params.should.eql({ '0': '1' });
        }, this.regExpPattern, rendrRoute);

        handler(req, res);

    });

    describe('redirectTo', function () {
      var rendrRoute, res;

      beforeEach(function () {
        rendrRoute = { controller: 'users', action: 'show' },
        res = { redirect: sinon.spy() };
        this.req.rendrApp.get = sinon.stub();
      });

      function createHandler(options) {
        return router.getHandler(function () {
          this.redirectTo('/some_uri', options);
        }, this.pattern, rendrRoute);
      }

      it("should redirect to another page", function () {
        var handler = createHandler();
        handler(this.req, res);

        res.redirect.should.have.been.calledOnce;
        res.redirect.should.have.been.calledWithExactly('/some_uri');
        res.redirect.should.have.been.calledOn(res);
      });

      it("should redirect to another page using a specific http status code", function () {
        var handler = createHandler({status: 301});
        handler(this.req, res);

        res.redirect.should.have.been.calledOnce;
        res.redirect.should.have.been.calledWithExactly(301, '/some_uri');
        res.redirect.should.have.been.calledOn(res);
      });

      it("should redirect to the correct path with a rootPath set", function () {
        var handler = createHandler();
        this.req.rendrApp.get.withArgs('rootPath').returns('/myRoot');

        handler(this.req, res);

        res.redirect.should.have.been.calledOnce;
        res.redirect.should.have.been.calledWithExactly('/myRoot/some_uri');
        res.redirect.should.have.been.calledOn(res);
      });

    });
  });
});

function resetProperties(obj, properties) {
  _.each(properties, function(value, key) {
    obj.__defineGetter__(key, function() {
      return value;
    });
  });
}
