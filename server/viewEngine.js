/*global rendr*/

var Handlebars, layoutTemplate, layoutFinder, path, _;

path = require('path');
_ = require('underscore');

module.exports = exports = viewEngine;

// Expose this, i.e. for registering view helpers.
exports.Handlebars = Handlebars;

function viewEngine(viewPath, data, callback) {
  var app, layoutData;

  data.locals = data.locals || {};
  app = data.app;
  layoutFinder = app.layoutFinder;
  layoutData = _.extend({}, data, {
    body: getViewHtml(viewPath, data.locals, app),
    appData: app.toJSON(),
    bootstrappedData: getBootstrappedData(data.locals, app),
    _app: app
  });
  renderWithLayout(layoutData, callback);
}

/*
* render with a layout
*/
function renderWithLayout(locals, callback) {
  getLayoutTemplate(function(err, templateFn) {
    if (err) return callback(err);
    var html = templateFn(locals);
    callback(null, html);
  });
}

layoutTemplate = null;

/*
* Cache layout template function.
*/
function getLayoutTemplate(callback) {
  var layoutPath;

  if (layoutTemplate) {
    return callback(null, layoutTemplate);
  }
  layoutFinder.getTemplate('__layout', function(err, template) {
    if (err) return callback(err);
    layoutTemplate = template;
    callback(err, layoutTemplate);
  });
}

function getViewHtml(viewPath, locals, app) {
  var BaseView, View, name, view;

  BaseView = require('../shared/base/view');
  locals = _.clone(locals);

  // Pass in the app.
  locals.app = app;
  name = path.basename(viewPath);
  View = BaseView.getView(name);
  view = new View(locals);
  return view.getHtml();
}

function getBootstrappedData(locals, app) {
  var bootstrappedData, modelUtils;

  modelUtils = require('../shared/modelUtils');
  bootstrappedData = {};
  _.each(locals, function(modelOrCollection, name) {
    if (modelUtils.isModel(modelOrCollection) || modelUtils.isCollection(modelOrCollection)) {
      bootstrappedData[name] = {
        summary: app.fetcher.summarize(modelOrCollection),
        data: modelOrCollection.toJSON()
      };
    }
  });
  return bootstrappedData;
}
