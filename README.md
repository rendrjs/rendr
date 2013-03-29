Rendr
=====

Rendr is a small library that allows you to run your [Backbone.js](http://backbonejs.org/) apps seamlessly on both the client and the server. Allow your web server to serve fully-formed HTML pages to any deep link of your app, while preserving the snappy feel of a traditional Backbone.js client-side MVC app.

Check out the [blog post](http://nerds.airbnb.com/weve-launched-our-first-nodejs-app-to-product) for a more thorough introduction to Rendr.

Too see how to use Rendr to build a simple web app, check out [airbnb/rendr-app-template](https://github.com/airbnb/rendr-app-template).


## The Premise

Our hypothesis is that there has to be a better way to build rich web apps today. In the last few years, we've seen more of the application moved to the client-side, with JavaScript representations of views, templates, and models. This can result in interactive, native-style apps, but it also poses challenges. SEO, performance, and maintainability become issues with splitting up your app into two distinct codebases, often in different languages.


## The Goals

Rendr is intended to be a building block along the way to this envisionsed future of web apps that can be run on either side of the wire according to the needs of your application. 

## What's Included

Rendr does not attempt to be a fully-fledged application framework. Instead, it follow's Backbone's lead by imposing minimal structure, allowing the application developer to use the library in this most appropriate way.

## What's Not Included

* Asset pipeline


## Contributing

Submit a pull request.

## License

MIT