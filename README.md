[![travis-ci status](https://secure.travis-ci.org/rendrjs/rendr.png)](http://travis-ci.org/#!/rendrjs/rendr/builds)
[![Dependency Status](https://david-dm.org/rendrjs/rendr.png)](https://david-dm.org/rendrjs/rendr)
[![Coverage Status](https://coveralls.io/repos/rendrjs/rendr/badge.png)](https://coveralls.io/r/rendrjs/rendr)

<img src="http://cl.ly/image/272q3f1u313b/Rendr-logotype.png" width="395" height="100">

Rendr is a small library that allows you to run your [Backbone.js](http://backbonejs.org/) apps seamlessly on both the client and the server. Allow your web server to serve fully-formed HTML pages to any deep link of your app, while preserving the snappy feel of a traditional Backbone.js client-side MVC app.

## Reporting problems and getting help

Please use the [issue tracker][issues] to report bugs. For support with using
rendr, try asking in the [Google group][ggroup] or join #rendr on
irc.freenode.org.

[ggroup]: https://groups.google.com/forum/#!forum/rendrjs
[issues]: https://github.com/rendrjs/rendr/issues


## Getting Started

To see how to use Rendr to build a simple web app, check out the [examples](https://github.com/rendrjs/rendr/tree/master/examples) directory for a number of different ways to set up a Rendr app.

Check out the [blog post](http://nerds.airbnb.com/weve-launched-our-first-nodejs-app-to-product) for a more thorough introduction to Rendr.

## The Premise

Our hypothesis is that there has to be a better way to build rich web apps today. In the last few years, we've seen more of the application moved to the client-side, with JavaScript representations of views, templates, and models. This can result in interactive, native-style apps, but it also poses challenges. SEO, performance, and maintainability become issues with splitting up your app into two distinct codebases, often in different languages.


## The Goals

Rendr is intended to be a building block along the way to this envisionsed future of web apps that can be run on either side of the wire according to the needs of your application.

Some specific design goals:

* Write application logic agnostic to environment
* Minimize `if (server) {...} else {...}`
* Talk to RESTful API
* Library, not a framework
* Hide complexity in library
* No server-side DOM
* Simple Express middleware

## What's Included

Rendr does not attempt to be a fully-fledged, batteries-included application framework. Instead, it follows Backbone's lead by imposing minimal structure, allowing the developer to use the library in the most appropriate way for their application.

## Base classes

### `BaseView`

Inherits from `Backbone.View`.

#### Public methods

#### `view.initialize()`
*Environment: shared.*

This is where you put any initialization logic.

#### `view.preRender()`
*Environment: shared.*

#### `view.render()`
*Environment: client.*

You should never have to override `view.render()` unless you're doing something really custom. Instead, you should be able to do anything you need using `view.postRender()`,

#### `view.postRender()`
*Environment: client.*

Here is where you'd put any initialization code that needs to access the DOM. This is a good place for jQuery plugins, sliders, etc.

#### `view.getTemplateData()`
*Environment: shared.*

The default implementation returns something reasonable: essentially `view.model.toJSON()` or `{models: view.collection.toJSON()}`. This method is easy to override in order to pass custom data to the template, or to decorate the model data.

```js
var MyView = BaseView.extend({
  getTemplateData: function() {
    // Get `super`.
    var data = BaseView.prototype.getTemplateData.call(this);
    return _.extend({}, data, {
      someOtherProperty: 'something custom'
    });
  }
});
```

#### Methods you can override for custom view behaviors

#### `view.getTemplate()`
*Environment: shared.*

You should never need to touch this, unless you're heavily customizing the view. Return a function that gets executed with a single `data` object as an argument.

#### `view.getTemplateName()`
*Environment: shared.*

You'll probably never touch this unless you're heavily customizing the view. This defaults to `view.constructor.id`. You can return a string to render a different template. This is used by the default implementation of `view.getTemplate()`.

#### `view.getInnerHtml()`
*Environment: shared.*

#### `view.getHtml()`
*Environment: shared.*

#### `view.getAttributes()`
*Environment: shared.*

Gets HTML attributes for outer DOM element. Used by `view.getHtml()`.

### `BaseModel`

Inherits from `Backbone.Model`.

### `BaseCollection`

Inherits from `Backbone.Collection`.

### `BaseApp`

Inherits from `Backbone.Model`.

### `BaseAppView`

Inherits for `BaseView`. You can change your main content container from this view by changing the `contentEl` key in the `options` object when extending `BaseAppView`

```javascript
var AppView = BaseAppView.extend({
  options : {
    contentEl : "#mainContent"
  }
})
```

### `BaseRouter`

### `ClientRouter`

Inherits from `BaseRouter`.

### `ServerRouter`

Inherits from `BaseRouter`.


## Rendr Options


### Server Config

####Example

```
var config = {
  dataAdapterConfig: {
    'default': {
      host: 'api.github.com',
      protocol: 'https'
    }
  },

  apiPath: '/api',
  appData: { myAttr: 'value'},
  dataAdapter: myDataAdapterInstance,
  defaultEngine: 'js',
  entryPath: process.cwd() + '/myapp'
  errorHandler: function (err, req, res, next){},
  notFoundHandler: function (req, res, next){},
  viewsPath: "/app/views",
};
rendr.createServer(config);

```

Either a ``dataAdapter`` or ``dataAdapterConfig`` must be present.


- ``dataAdapterConfig`` - This is the standard way of configuring Rendr's built in  DataAdapter.  See [DataAdapter Config](#dataadapter-config)


- ``dataAdapter`` - Allows you to override the default DataAdapter and provide your own.  The ``dataAdapterConfig`` will be ignored.

    **Default:**  [RestAdapter](https://github.com/rendrjs/rendr/blob/master/server/data_adapter/rest_adapter.js) which enables Rendr to speak basic REST using HTTP & JSON.  This is good for consuming an     existing RESTful API that exists externally to your Node app.


---

- ``apiPath`` *Optional* - Root of the API proxy's virtual path. Anything after this root will be followed by a ``-``. Example: ``/api/-/path/to/resource``. Allows the proxy to intercept API routes. Can also be a full path to a remote API ``http://api.myserver``

    **Default:** ``api``

- ``appData`` *Optional* - Pass any data that needs to be accessible by the client. Accessible from within your Handlebars context ``app.attributes.myAttr``, and also within your views and models ```this.app.attributes.myAttr```.


- ``defaultEngine`` *Optional* - Tell the ViewEngine to load different file types. Example: ``coffee``

    **Default:** ``js``

- ``entryPath`` *Optional* - Root path of your app.

    **Default:** ``process.cwd() + '/'`` - Current working directory of the node process

- ``errorHandler`` *Optional* Callback for [Express.js errors](http://expressjs.com/guide.html#error-handling).

   **Example** ``function (err, req, res, next) { }``


- ``notFoundHandler`` *Optional* - Callback for [Express.js not found errors](http://expressjs.com/guide.html#error-handling)

   **Example** ``function (req, res, next) { }``

- ``viewEngine`` *Optional* - Provides a way to set a custom [Express.js view engine](http://expressjs.com/api.html#app.engine)

    **Default:** ``new ViewEngine()`` - Rendr provides a built in [ViewEngine](https://github.com/rendrjs/rendr/blob/master/server/viewEngine.js) that hooks to [Template Adapters](#template-adapters).  See [rendr-handlebars](https://github.com/rendrjs/rendr-handlebars).

- ``viewsPath`` *Optional* - Override where your views are stored. Path is relative to ``entryPath``.

    **Default:** ``app/views``


### DataAdapter Config

This configuration is passed to the current DataAdapter, which by default is the [RestAdapter](https://github.com/rendrjs/rendr/blob/master/server/data_adapter/rest_adapter.js).


####Example

**Simple**

```
var dataAdapterConfig = {
  host: 'api.github.com',
  protocol: 'https'
};

```

**Multiple**

```
var dataAdapterConfig = {
  'default': {
    host: 'api.github.com',
    protocol: 'https'
  },
  'travis-ci': {
    host: 'api.travis-ci.org',
    protocol: 'https'
  }
};

```

Example of how a Backbone model can be configured to select one of the DataAdapter configs.

*Note: This example assumes you are using the [RestAdapter](https://github.com/rendrjs/rendr/blob/master/server/data_adapter/rest_adapter.js).*

````
module.exports = Base.extend({
  url: '/repos/:owner/:name',
  api: 'travis-ci'
});
module.exports.id = 'Build';

````

### Adding middleware to Rendr's Express


You can optionally add any custom middleware that has to access `req.rendrApp` but should run before
the Rendr routes by calling configure after createServer.

```

rendr.createServer(config);
rendr.configure(function(expressApp) {

    expressApp.use(...)

})

```

### Template Adapters

Provides a way for Rendr to utilize custom html template engines.  Rendr's [ViewEngine](https://github.com/rendrjs/rendr/blob/master/server/viewEngine.js) will delegate to the [Template Adapter](https://github.com/rendrjs/rendr-handlebars/blob/master/index.js). You can build your own to provide your template engine of choice (i.e. Jade, Underscore templates, etc).

####Available Template Adapters

- [rendr-handlebars](https://github.com/rendrjs/rendr-handlebars) - [Handlebars.js](https://github.com/wycats/handlebars.js) support.  This is the default adapter.

- [rendr-emblem](https://github.com/modalstudios/rendr-emblem) - [Emblem.js](https://github.com/machty/emblem.js/) with [Handlebars.js](https://github.com/wycats/handlebars.js) fallback support.


####Using Custom Adapters

You can tell Rendr which Template Adapter to use.  This represents the node-module that contains the adapter.

````
// /app/app.js

module.exports = BaseApp.extend({
  defaults: {
    templateAdapter: 'rendr-emblem'
  }

});

````


### Express middleware

There are a few middleware functions included. Use some or all of these, or use your own.


### `initApp`

## What's Not Included

### Express app

Rather than owning your entire Express app, Rendr simply provides some useful middleware that you can mount into your existing Express app.

### Asset pipeline

Asset bundling and serving are outside of Rendr's scope. However, it does have some specific requirements for JavaScript packaging to support modules that are accessible in the CommonJS style on both the client and server. The [example app](https://github.com/rendrjs/rendr/tree/master/examples/00_simple) uses [Stitch](https://github.com/sstephenson/stitch) for this, though you could also do this with other tools, such as [Browserify](https://github.com/substack/node-browserify).

## Notes

Rendr uses the native ECMAScript 5 methods `Array.prototype.map`, `Function.prototype.bind`, `Object.create`, etc. If you plan to support older browsers, such as IE<=8, you should include the lovely [es5-shim](https://github.com/kriskowal/es5-shim) (and es5-sham) libraries as client-side dependencies.

## Contributing

We'd love to see what the community can come up with! There are no doubt a number of developers who are tackling this same problem, and we can learn from each other. If you have a bug fix or feature proposal, submit a pull request with a clear description of the change, plus tests.

Rendr was originally developed by [@braitz](https://github.com/braitz) and [@spikebrehm](https://github.com/spikebrehm), and now has a healthy list of [contributors](https://github.com/rendrjs/rendr/graphs/contributors).

## License

MIT



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/rendrjs/rendr/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

