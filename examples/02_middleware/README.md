# Rendr App Template
## GitHub Browser

The purpose of this little app is to demonstrate one way of using Rendr to build a web app that runs on both the client and the server.

![Screenshot](http://cl.ly/image/062d3S2D1Y38/Screen%20Shot%202013-04-09%20at%203.14.31%20PM.png)

## Running the example

First, make sure to have Node >= 0.8.0 [installed on your system](http://nodejs.org/). Also, make sure to have `grunt-cli` installed globally.

    $ npm install -g grunt-cli

If you see an error on startup that looks [like this](https://github.com/rendrjs/rendr-app-template/issues/2), then you may need to un-install a global copy of `grunt`:

    $ npm uninstall -g grunt

Run `npm install` to install dependencies:

    $ npm install

Then, use `grunt server` to start up the web server. Grunt will recompile and restart the server when files change.

    $ grunt server

    Running "runNode" task

    Running "handlebars:compile" (handlebars) task
    11 Dec 17:40:30 - [nodemon] v0.7.10
    11 Dec 17:40:30 - [nodemon] to restart at any time, enter `rs`
    11 Dec 17:40:30 - [nodemon] watching: /Users/spike/code/rendr/examples/00_simple
    File "app/templates/compiledTemplates.js" created.

    Running "browserify:basic" (browserify) task
    11 Dec 17:40:30 - [nodemon] starting `node index.js`
    connect.multipart() will be removed in connect 3.0
    visit https://github.com/senchalabs/connect/wiki/Connect-3.0 for alternatives
    connect.limit() will be removed in connect 3.0
    server pid 86724 listening on port 3030 in development mode
    >> Bundled public/mergedAssets.js

    Running "stylus:compile" (stylus) task
    File public/styles.css created.

    Running "watch" task
    Waiting...

    11 Dec 17:40:32 - [nodemon] starting `node index.js`
    server pid 86728 listening on port 3030 in development mode

Now, pull up the app in your web browser. It defaults to port `3030`.

    $ open http://localhost:3030

You can choose a different port by passing the `PORT` environment variable:

    $ PORT=80 grunt server

### GitHub API rate limit

GitHub [rate limits](http://developer.github.com/v3/#rate-limiting) unauthenticated requests to its public API to 60 requests per hour per IP. This should be enough for just playing with the sample app, but if you pull it down and start developing off it you may run up against the rate limit.

**You've been warned.** Your best bet may be to alter the project to read from your favorite RESTful API.

## Getting Started With Rendr

It's worthwhile to read the first [blog post](http://nerds.airbnb.com/weve-launched-our-first-nodejs-app-to-product), which has some background on Rendr and its *raison d'être*.

This basic Rendr app looks like a hybrid between a standard client-side MVC Backbone.js app and an Express app, with a little Rails convention thrown in.

Check out the directory structure:

    |- app/
    |--- collections/
    |--- controllers/
    |--- models/
    |--- templates/
    |--- views/
    |--- app.js
    |--- router.js
    |--- routes.js
    |- assets/
    |- config/
    |- public/
    |- server/

**Note**: I want to stress that this is just one way to build an app using Rendr. I hope it can evolve to support a number of different app configurations, with the shared premise that the components should be able to run on either side of the wire. For example, the full-on client-side MVC model isn't appropriate for all types of apps. Sometimes it's more appropriate to load HTML fragments over the wire, also known as PJAX. Rendr apps should be able to support this as well.

## CommonJS using Browserify

Node.js uses the CommonJS module pattern, and using a tool called
[Browserify](https://github.com/substack/node-browserify), we can utilize our CommonJS modules in
the browser. This looks familiar in Node.js:

```js
var User = require('app/models/user');
```
Using Browserify, we can use the same `require()` function in the browser. This allows us to focus on application logic, not packaging modules separately for client and server.

In Node.js, you can also use `require()` to load submodules within NPM models. For example, we could load Rendr's base view in order to extend it to create a view for our app.

```js
var BaseView = require('rendr/shared/base/view');
```

This module path works in the browser as well.

## Routes file

```js
// app/routes.js
module.exports = function(match) {
  match('',                   'home#index');
  match('repos',              'repos#index');
  match('repos/:owner/:name', 'repos#show');
  match('users'       ,       'users#index');
  match('users/:login',       'users#show');
};

```

## Controllers

A controller is a simple JavaScript object, where each property is a controller action. Keep in mind that controllers are executed on both the client and the server. Thus, they are an abstraction whose sole responsibility is to specify which data is needed to render the view, and which view to render.

On the server, controllers are executed in response to a request to the Express server, and are used to render the initial page of HTML. On the client, controllers are executed in response to `pushState` events as the user navigates the app.

Here is a very simple controller:

```js
// app/controllers/home_controller.js
module.exports = {
  index: function(params, callback) {
    callback(null, 'home_index_view');
  }
};

```

Every action gets called with two arguments: `params` and `callback`. The `params` object contains both route params and query string params. `callback` is called to kick off view rendering. It has this signature:

```js
function(err, viewName, viewData) {}
```

### `err`
Following the Node.js convention, the first argument to the callback is `err`. We'll pass null here because we're not fetching any data, but if we were, that's how we'd communicate a fetching error.

### `viewName`
This is a string identifier of a view, used by the router to find the view class, i.e.:

```js
require('app/views/' + viewName);
```

### `viewData` (optional)
An object to pass to the view constructor. This is how we pass data to the view.

All our `index` action above really does is specify a view class. This is the simple case -- no data fetching, just synchronous view rendering.

It gets more interesting when we decide to fetch some data. Check out the `repos_controller` below:

```js
// app/controllers/repos_controller.js
module.exports = {
  // ...

  show: function(params, callback) {
    var spec = {
      model: {model: 'Repo', params: params}
    };
    this.app.fetch(spec, function(err, result) {
      callback(err, 'repos_show_view', result);
    });
  }
};

```

You see here that we call `this.app.fetch()` to fetch our Repo model. Our controller actions are executed in the context of the router, so we have a few properties and methods available, one of which is `this.app`. This is the instance of our application's App context, which is a sublcass of `rendr/base/app`, which itself is a subclass of `Backbone.Model`. You'll see that we inject `app` into every model, view, collection, and controller; this is how we maintain app context throughout our app.

You see here that we call `callback` with the `err` that comes from `this.app.fetch()`, the view class name, and the `result` of the fetch. `result` in this case is an object with a single `model` property, which is our instance of the `Repo` model.

`this.app.fetch()` does a few nice things for us; it fetches models or collections in parallel, handles errors, does caching, and most importantly, provides a way to boostrap the data fetched on the server in a way that is accessible by the client-side on first render.

## Views

A Rendr view is a subclass of `Backbone.View` with some additional methods added to support client-server rendering, plus methods that make it easier to manage the view lifecycle.

Creating your own view should look familiar if you've used Backbone:

```js
// app/views/home_index_view.js
var BaseView = require('./base_view');

module.exports = BaseView.extend({
  className: 'home_index_view',

  events: {
    'click p': 'handleClick',
  },

  handleClick: function() {…}
});
module.exports.id = 'HomeIndexView';
```

You can add `className`, `tagName`, `events`, and all of the other `Backbone.View` properties you know and love.

We set the property `id` on the view constructor to aid in the view hydration process. More on that later.

Our views, just like all of the code in the `app/` directory, are executed in both the client and the server, but of course certain behaviors are only relevant in the client. The `events` hash is ignored by the server, as well as any DOM-related event handlers.

Notice there's no `render()` method or `template` property specified in the view. The philosophy here is that sensible defaults and convention over configuration should allow you to skip all the typical boilerplate when creating views. The `render()` method should be the same for all your views; all it does is  mash up the template with some data to generate HTML, and insert that HTML into the DOM element.

Now, because we're not using a DOM to render our views, we must make sure that the view returns all its HTML as a string. On the server, `view.getHtml()` is called, which returns the view's outer HTML, including wrapper element. This is then handed to Express, which wraps the page with a layout and sends the full HTML page to the client. Behind the scenes, `view.getHtml()` calls `view.getInnerHtml()` for the inner HTML of the view, not including wrapping element, and then constructs the wrapping element based on the `tagName`, `className`, etc. properties, and the key-value pairs of HTML attributes returned by `view.getAttributes()`, which allows you to pass custom attributes to the outer element.

On the client, `view.render()` is called, which updates the view's DOM element with the HTML returned from `view.getInnerHtml()`. By default, Backbone will create the wrapper DOM element on its own. We make sure to also set any custom HTML attributes in `view.getAttributes()` on the element.

### The view lifecycle


A common need is to run some initialization code that touches the DOM after render, for things like jQuery sliders, special event handling, etc. Rather than overriding the `render()` method, use `postRender()`. The `postRender()` method is executed for every view once after rending, including after initial pageload.

```js
// app/views/home_index_view.js
var BaseView = require('./base_view');

module.exports = BaseView.extend({
  className: 'home_index_view',

  postRender: function() {
    this.$('.slider').slider();
  }
});
module.exports.id = 'HomeIndexView';
```

If you have a need to customize the way your views generate HTML, there are a few specific methods you can override.

#### getTemplateName()

By default, `getTemplateName()` returns the underscored version of the view constructor's `id` property; so in our case, `home_index_view`. It will also look for `options.template_name`, which is useful for initialing views to use a certain template. The view will look in `app/templates` for the value returned by this function.

#### getTemplate()

If `getTemplateName()` isn't enough, you can override `getTemplate()` to return a function that takes a single `data` argument and returns HTML:

```js
function(data) {
  ...
  return html;
}
```

This HTML is used to populate the view's inner HTML; that is, not including the wrapper element, which you can specify on the view itself using `tagName`, `className`, and `id`.

#### getInnerHtml()

If you're building some sort of composite view that doesn't utilize a simple template, override `getInnerHtml()`. This is useful for tabbed views, collection views, etc.

#### getHtml()

You probably shouldn't ever need to override this; by default it just combines the HTML returned by `getInnerHtml()` and the HTML attributes returned by `getAttributes()` to produce an outer HTML string.

## The view hierarchy

Rendr provides a Handlebars helper `{{view}}` that allows you to declaratively nest your views, creating a view hierarchy that you can traverse in your JavaScript.  Check out [`app/templates/users/show.hbs`](https://github.com/rendrjs/rendr-app-template/blob/master/app/templates/users/show.hbs) and [`app/views/users/show.js`](https://github.com/rendrjs/rendr-app-template/blob/master/app/views/users/show.js) for an example:

```html
<!-- app/templates/users/show.hbs -->
...

<div class="span6">
  {{view "user_repos_view" collection=repos}}
</div>

<div class="span6">
  ...
</div>
```

You see that we use the `{{view}}` helper with an argument that indicates which view to be rendered. We can pass data into the view using [Handlebars' hash arguments](http://handlebarsjs.com/expressions.html). Anything you pass as hash arguments will be pass to the subview's constructor and be accessible as `this.options` within the subview. There are a few special options you can pass to a view: `model` or `collection` can be used to directly pass a model or collection instance to a subview. The options `model_name` + `model_id` or `collection_name` + `collection_params` can be used in conjunction with `lazy="true"` to lazily fetch models or collections; more on that later.

Now, from within the `users/show` view, we can access any child views using the `this.childViews` array.  A good way to debug and get a feel for this in the browser is to drill down into the global `App` property, which is your instance of `BaseApp`. From `App` you can access other parts of your application. `App.router` is your instance of `ClientRouter`, and it has a number of properties that you can inspect. One of these is `App.router.currentView`, which will always point to the current main view for a page.  For example, if you are viewing wycats' page in our app, [http://localhost:3030/users/wycats](http://localhost:3030/users/wycats), `currentView` will be an instance of `users/show`:

    App.router.currentView
    => child {render: function, cid: "view434", model: child, options: Object, $el: p.fn.p.init[1]…}

From there, we can find our child `user_repos_view` view:

	App.router.currentView.childViews
	=> [child]

	App.router.currentView.childViews[0]
	=> child {render: function, cid: "view436", options: Object, $el: p.fn.p.init[1], el: div.user_repos_view…}

Check out its collection property, which is the instance of `Repos` which we fetched in the controller and passed down in the `{{view}}` helper:

	App.router.currentView.childViews[0].collection
	=> child {options: Object, app: child, params: Object, meta: Object, length: 30…}

You can nest subviews *ad infinitum*. Our `user_repos_view` has an empty `childViews` array now, but we could add some subviews if we found it useful for organizing our codebase, or keeping things DRY.

	App.router.currentView.childViews[0].childViews
	=> []

Views also have a `parentView` property, which will be non-null unless they are a top-level view.

	App.router.currentView.childViews[0].parentView === App.router.currentView
	=> true

	App.router.currentView.parentView
	=> null

## Templates

So far, Rendr just supports Handlebars templates, but it should be possible to make this interchangeable. For now, place your templates in `app/templates` with a name that matches the underscorized view's identifier and file extension of `.hbs`.  So, the view with an identifier of `HomeIndexView` will look for a template at `app/templates/home_index_view.hbs`.


## Interacting with a RESTful API


## Assets

In this example we use [Grunt](https://github.com/gruntjs/grunt) to manage asset compilation. We
use [Browserify](https://github.com/substack/node-browserify) to package our JavaScript in a way
that allows us to retain the CommonJS semantics for the browser. We compile stylesheets using
[Stylus](https://github.com/learnboost/stylus). Check out `Gruntfile.js` in the root directory of
this repo for details.


## License

MIT
