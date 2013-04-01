Rendr
=====

Rendr is a small library that allows you to run your [Backbone.js](http://backbonejs.org/) apps seamlessly on both the client and the server. Allow your web server to serve fully-formed HTML pages to any deep link of your app, while preserving the snappy feel of a traditional Backbone.js client-side MVC app.

Check out the [blog post](http://nerds.airbnb.com/weve-launched-our-first-nodejs-app-to-product) for a more thorough introduction to Rendr.

Too see how to use Rendr to build a simple web app, check out [airbnb/rendr-app-template](https://github.com/airbnb/rendr-app-template).


## The Premise

Our hypothesis is that there has to be a better way to build rich web apps today. In the last few years, we've seen more of the application moved to the client-side, with JavaScript representations of views, templates, and models. This can result in interactive, native-style apps, but it also poses challenges. SEO, performance, and maintainability become issues with splitting up your app into two distinct codebases, often in different languages.


## The Goals

Rendr is intended to be a building block along the way to this envisionsed future of web apps that can be run on either side of the wire according to the needs of your application.

Some specific design goals:

* Write Models, Views, Controllers agnostic to environment
* Minimize `if (server) {...} else {…}`
* Talk to RESTful API
* Library, not a framework
* Hide complexity in library
* No server-side DOM
* Simple Express middleware

## What's Included

Rendr does not attempt to be a fully-fledged, batteries-included application framework. Instead, it follows Backbone's lead by imposing minimal structure, allowing the developer to use the library in the most appropriate way for their application.

### Base classes

#### `BaseView`

Inherits from `Backbone.View`.

#### `BaseModel`

Inherits from `Backbone.Model`.

#### `BaseCollection`

Inherits from `Backbone.Collection`.

#### `BaseApp`

Inherits from `Backbone.Model`.

#### `BaseRouter`

#### `ClientRouter`

Inherits from `BaseRouter`.

#### `ServerRouter`

Inherits from `BaseRouter`.


## What's Not Included

### Express app

Rather than owning your entire Express app, Rendr simply provides some useful middleware that you can mount into your existing Express app.

### Asset pipeline

Asset bundling and serving are outside of Rendr's scope. However, does it have some specific requirements for JavaScript packaging to support modules that are accessible in the CommonJS style on both the client and server. The [example app](https://github.com/airbnb/rendr-app-template) uses [Stitch](https://github.com/sstephenson/stitch) for this, though you could also do this with other tools, such as [Browserify](https://github.com/substack/node-browserify).

## TODO

While we do have it powering a few apps in production here at Airbnb, Rendr is still a prototype. It's a [spike](http://scaledagileframework.com/spikes/); a functional proof-of-concept of a shared client-server architecture based on Backbone. Thus, it carries over a number of design quirks specific to its original use case, and it's not yet very generalized and modular.

Some of the more glaring things to do:

* Support Browserify and streamline module packaging.
* Support templating solutions other than Handlebars.
* Pull out routing code into separate module and share it between client and server, to prevent bugs arising from using `Backbone.history` to process routes in the client, and Express to process routes on the server.

## Contributing

We'd love to see what the community can come up with! There are no doubt a number of developers who are tackling this same problem, and we can learn from each other. If you have a bug fix or feature proposal, submit a pull request with a clear description of the change, plus tests.

## License

MIT
