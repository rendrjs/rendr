require('../../shared/globals')
should = require('should')
Router = require('../../server/router')

config =
  paths:
    entryPath: "#{__dirname}/../fixtures"

shouldMatchRoute = (actual, expected) ->
  actual.should.be.an.instanceOf Array
  actual.slice(0, 2).should.eql expected
  actual[2].should.be.an.instanceOf Function

describe "server/router", ->

  beforeEach ->
    @router = new Router(config)

  describe "route", ->

    it "should add basic route definitions", ->
      route = @router.route("test", "test#index")
      shouldMatchRoute(route, ['/test', {controller: 'test', action: 'index'}])

    it "should support leading slash in pattern", ->
      route = @router.route("/test", "test#index")
      shouldMatchRoute(route, ['/test', {controller: 'test', action: 'index'}])

    it "should support object as second argument", ->
      route = @router.route("/test", {controller: 'test', action: 'index', role: 'admin'})
      shouldMatchRoute(route, ['/test', {controller: 'test', action: 'index', role: 'admin'}])

    it "should support string as second argument, object as third argument", ->
      route = @router.route("/test", "test#index", {role: 'admin'})
      shouldMatchRoute(route, ['/test', {controller: 'test', action: 'index', role: 'admin'}])

  describe "routes", ->

    it "should return the aggregated routes", ->
      @router.route("users/:id", "users#show")
      routes = @router.routes()
      routes.length.should.eql 1
      shouldMatchRoute(routes[0], ['/users/:id', {controller: 'users', action: 'show'}])

      @router.route("users/login", "users#login")
      routes = @router.routes()
      routes.length.should.eql 2
      shouldMatchRoute(routes[0], ['/users/:id', {controller: 'users', action: 'show'}])
      shouldMatchRoute(routes[1], ['/users/login', {controller: 'users', action: 'login'}])

    it "should return a copy of the routes, not a reference", ->
      @router.route("users/:id", "users#show")
      routes = @router.routes()

      # Modify the routes array
      routes.push('foo')
      @router.routes().length.should.eql 1

      # Also modify an individual route element
      @router.routes()[0].length.should.eql 3
      @router.routes()[0].shift()
      @router.routes()[0].length.should.eql 3

  describe "buildRoutes", ->

    it "should build route definitions based on routes file", ->
      @router.buildRoutes()
      routes = @router.routes()
      routes.length.should.eql 3
      shouldMatchRoute(routes[0], ['/users/login', {controller: 'users', action: 'login'}])
      shouldMatchRoute(routes[1], ['/users/:id', {controller: 'users', action: 'show'}])
      shouldMatchRoute(routes[2], ['/test', {controller: 'test', action: 'index'}])

  describe "match", ->

    it "should return the route info for a matched path, no leading slash", ->
      @router.route("/users/:id", "users#show")
      route = @router.match('users/1234')
      shouldMatchRoute(route, ['/users/:id', {controller: 'users', action: 'show'}])

    it "should return the route info for a matched path, with leading slash", ->
      @router.route("/users/:id", "users#show")
      route = @router.match('/users/1234')
      shouldMatchRoute(route, ['/users/:id', {controller: 'users', action: 'show'}])

    # Need to ship this; come back and fix.
    it.skip "should return the route info for a matched full URL", ->
      @router.route("/users/:id", "users#show")
      route = @router.match('https://www.example.org/users/1234')
      shouldMatchRoute(route, ['/users/:id', {controller: 'users', action: 'show'}])

    it "should return null if no match", ->
      should.not.exist(@router.match('abcd1234xyz'))

    it "should match in the right order", ->
      @router.route("/users/login", "users#login")
      @router.route("/users/:id", "users#show")

      route = @router.match('users/thisisaparam')
      shouldMatchRoute(route, ['/users/:id', {controller: 'users', action: 'show'}])

      route = @router.match('users/login')
      shouldMatchRoute(route, ['/users/login', {controller: 'users', action: 'login'}])

