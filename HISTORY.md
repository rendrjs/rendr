# 1.1.4
* Bug fix for views being attached async vs in series
* Bug fix for possible XSS issue on client-side routing

# 1.1.3
* Bug fixes for AMD environments

# 1.1.2
* Bug fix for broken build, companion dependency was incorrect.

# 1.1.1
* added lazy loading callback handlers
* support for xhr timeouts
* added a code of conduct

# 1.1.0
## 2015-06-11
* update to backbone 1.2.1 and all it's goodness, older versions of lodash *will break* with this change set. lodash.mixin should allow for a fix
* add x-http-method-override to allow for the 'emulateHTTP' property in backbone.

# 1.0.5
## 2015-05-15
* bug fix for require js race condition when rendering views
* lazy loading now takes fetch_options to set any of the fetchOptions, same object as in the controller
* lazy loading now takes fetch_spec to allow for multiple models / collections to be loaded for a view on the client-side, this spec is the same as a controllers fetch spec.

# 1.0.4
## 2015-05-8
* Routes can specify custom headers
* Allows for a custom layout filename
* Bugfix: Case where some views were rendered twice
* Allow for custom template finder, option for the app
* allows readFromCache to be set to true / false in the fetch spec
* Pass a templateEngine to the template adapter, at the application level.
* Dependency updates

# 1.0.3
## 2015-03-27
* Bug fix for Require.js  Needs to statically analyze the include in shared/app.js for the router.

# 1.0.2
## 2015-03-26
* Fixes / Updates to make Rendr work with require.js
* added ability to pass in template adapter instance
 * move towards pulling the view layer out
 * allows watchify / browserify to rebuild single files rather than the entire package

# 1.0.1
## 2015-02-26
* upgrade dependencies
 * express
 * underscore
 * rendr-handlebars
 * chai
 * sinon-chai
* fix a few cases where `window.$` was being accessed instead of `Backbone.$`
* fix for collection store when lazy-loading a collection (two collections were in the store, now only one)
* fix for restAdapter that was putting `?` when req.query was an empty object

# 1.0.0
## 2015-02-11
* upgrade to express 4.11.0
  * added `errorhandler` instead of using the express.errorHandler that is deprecated
* *breaking* dropped node 0.8 support
* *breaking* dropped express 3.x support
* added support for node 0.12
* removed noop definition in favor of _.noop
* *breaking* removed postInitialization callbacks
* fixed issue with collection where a re-fetch call will override parameters with an empty object
* v8 runtime optimizations
* fixed the way view keeps track of it's childViews
* updated all devDependencies
* updated request to use latest version - security fix
* added .jshint
* moved from `qs` to `qs2` to support `q[]=1&q[]=2` parameters for arrays by default
* *breaking* removed `match` function from the server
* *breaking* removed `checkFresh` - changed to use `expireSeconds` for the store so the store can check instead

# 0.5.2
## 2015-01-9
* parseModelAndCollection optionally parses sub-models / sub-collections
* fix for the re-rendering the view on a `refresh` event when the view is hydrated
* upgrade to dev dependency for rendr-handlebars to 0.2.2
* parse collections into an instance of a collection if it isn't already

# 0.5.1
## 2014-12-11
* Changed how views are attached to the document, now calls the `render` method when given the appropriate flag.
* Added tests around base/view.js
* Added a `clear` method to the model and collection stores
* Fixed model collection from the store, will no longer create new instances of the model
* Added the ability to pass a JSON object to `fetch_params` when lazy loading views. This way we can pass multiple parameters to those models / collections.
* Upgraded `qs` dependency
* Fixed query string attribute when loading collections, now will properly send data on client and server.
* Fix in the view's parse options to not override the model / collection attribute after they've been re-inflated.
* Added fix for the `parse` method to allow for sub-models / sub-collections
* Upgrade to Backbone 1.1.2
* Added support for nested params in ServerRouter

# 0.5.0
## 2014-02-25
* [deprecation] use `initialize` instead of `postInitialize`
* Fix serverSide redirectTo with rootPath != default.
* [breaking] Removed use of `options.emulateJSON` and `options.data` in `clientSync`
* [breaking] Removed `addApiParams` from `syncer`
* Many more tests.
* [breaking] Moved `AppView` to `client/` from `shared/`.
* [breaking] Added support for AMD (RequireJS), which resulted in many methods
  becoming asynchronous instead of synchronous (`Fetcher`, `BaseView`,
  `ModelUtils`, etc.
* [breaking] Removed global `entryPath`; no longer referencing `rendr` as a
  global.
* [breaking] Refactored server code to greatly reduce amount of boilerplate
  needed to set up a Rendr app. Rendr now owns its own Express app, which can
  be mounted on existing Express apps as a simple middleware.
* [breaking] `server/server.js` now exports a class constructor rather than a
  singleton.
* [breaking] Removed unused `ServerRouter#stashError()` method.
* [breaking] `modelUtils` object is now `ModelUtils` class.
* Added `DataAdapter` base class and fleshed-out `RestAdapter`, which is the
  default `DataAdapter` used by a Rendr server.
* More flexibility with placement Rendr app files within an Express project.
  app, and support for multiple Rendr apps in a single Express app.
* Support passing `appAttributes` to `initApp` middleware as either object or
  function, which takes `req` and `res` as arguments.
* Added `viewing` property to `BaseView` for better introspection of current
  view state.
* Fix bug where collection params weren't properly passed to collections upon
  view hydration.
* Attach `req` to `App` instance on the server-side.
* Switched default CommonJS packaging to Browserify from Stitch.
* Added `examples/` dir, deprecating separate `rendr-app-template` project.
* Fix bug where resources fetched by the `Fetcher` using spec keys other than
  `model` or `collection` would be not hydrated properly by `BaseView`.
* Don't intercept clicked links if 'shift' or 'meta' keys pressed.
* Make it easier to use custom `AppView` class.
* Add support for RegExp routes.
* Only attempt to use `pushState` to redirect if the path matches one of the
  app's routes.
* Trigger `action:error` event in `ClientRouter` if there was an error caught
  while running a controller's action.
* Allow customizing the app's root path.
* Added better support for `options.error` callback for `Backbone.sync()` in
  the client-side.
* Automatically add `X-Forwarded-For` header in `apiProxy` middleware.
* Support using functions for `BaseView#id`, `BaseView#className`, and
  `BaseView#tagName`.
* Support passing `options.status` to `ServerRouter#redirectTo()`.
* Use `sanitizer` module instead of un-maintained `validator` module for XSS
  protection.
* Update versions of dependencies: `underscore`, `qs`, `request`.
* Much more unit tests.
* Added Istanbul code coverage tool.

# 0.4.10
## 2013-08-02
* Increment to bump `rendr-handlebars` version.

# 0.4.9
## 2013-07-27
* Support multiple layout templates.

# 0.4.8
## 2013-07-26
* Use `rendr-handlebars` module instead of `handlebars` module and utilize new
  `templateAdapter` semantics (thanks @hurrymaplelad).
* Fix XSS vulnerability in `ServerRouter#escapeParams()`.
* Fix bug in `ServerRouter#getParams()`.
* Change `viewEngine` module to be a class constructor `ViewEngine`.
* Make sure to pass `app` instance to collections in `Fetcher#hydrate()`.

# 0.4.7
## 2013-06-27
* Fix for allowing port in absolute model URL.
* Style tweaks for comments, binding to a context in `this.on`-type events.
* Added `Fetcher.prototype.needsFetch` method, for custom model caching logic
  in controllers.
* Fix for `syncer.checkFresh` (thanks @eleventigers).
* Fix for view path on Windows (thanks @vincejl).
* README updates (thanks @jacoblwe20).
* Performance improvment by caching Express router in `ServerRouter` instead of
  rebuilding it between requests (@jlogsdon).

# 0.4.6
## 2013-06-01
* Support specifying multiple API hosts for models & controllers (thanks @technicolorenvy!).
* Support subdirectories for views & templates, and allow omitting view path in controllers,
  in which case view path defaults to ":controller/:action" (thanks @technicolorenvy!).

# 0.4.5
## 2013-05-27
* Use ES5 native methods instead of Underscore methods: `Array.prototype.map`,
  `Function.prototype.bind`, `Object.create`, etc.  NOTE: For IE<=8 compatibility,
  include `es5-shim` and `es5-sham` from [kriskowal/es5-shim](https://github.com/kriskowal/es5-shim)
  as client-side dependencies in your app.
* Windows-compatible `postinstall` script.
* Customize Handlebars `each` helper to pass through `_app`, `_view`, etc. into
  the child context, allowing cleaner `{{#each}} {{view "my_view"}} {{/each}}` semantics.
* Allow passing absolute URLs for models and collections, which will bypass the API proxy
  in the client-side.

# 0.4.4
## 2013-05-06
* In BaseView::getAttributes(), call toString() on model.id, for better support of Mongoose.
* In BaseView::getAttributes(), support custom this.model.idAttribute.
* Remove reference to `global.isServer` in BaseView; easier to standalone test.
* Default `replace: false` in ClientRouter::redirectTo().

# 0.4.3
## 2013-04-30
* Support `redirect` option in routes file.

# 0.4.1
## 2013-04-29
* Allow accessing `this.parentView` in `BaseView` during rendering.

# 0.4.0
## 2013-04-29
* Converted all CoffeeScript files to JavaScript.

# 0.3.4
## 2013-04-25
* No more globals for Backbone, _, Handlebars.

# 0.3.3
## 2013-04-25
* Updating to handlebars@0.1.10 to get bundled runtime file.

# 0.3.2
## 2013-04-19
* Ensuring that `ModelStore` passes `app` to models when instantiating them.

# 0.3.1
## 2013-04-18
* Added `apiProxy` middleware, pulled from `rendr-app-template`.

# 0.3.0
## 2013-04-18
* Breaking change: Renamed `dataAdapter.makeRequest` to `dataAdapter.request`.

# 0.2.4
## 2013-04-17
* Removing bundled jQuery. App should provide its own.

# 0.2.3
## 2013-04-17
* Allow passing `{pushState: false}` to `ClientRouter::redirectTo()` to do a
  full-page redirect.

# 0.2.2
## 2013-04-08
* Fixed bug where status code of CRUD errors were not properly passed down from `syncer`.

# 0.2.1
## 2013-04-07
* Fixed bug where models within collection wouldn't have `this.app` set after view hydration.
* Converted `fetcher` object to `Fetcher` class. Prefer to access it via `app.fetcher`.

# 0.2.0
## 2013-04-05
* Breaking change: Passing real `req` as first argument to `dataAdapter.makeRequest`.
* Fixing bug in ClientRouter when no querystring.
* Also return `@collection.meta` and `@collection.params` in `BaseView::getTemplateData()`.
* Support passing three args to `App::fetch()`.

# 0.1.1
## 2013-04-01
* ClientRouter params include querystring params, just like ServerRouter.

# 0.1.0
## 2013-04-01
* Initial release.
