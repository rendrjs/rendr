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
