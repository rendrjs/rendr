/*global rendr*/

var Handlebars, fs, layoutTemplate, _, path;

fs = require('fs');
_ = require('underscore');
Handlebars = require('handlebars');
path = require('path');

module.exports = exports = viewEngine;

// Expose this, i.e. for registering view helpers.
exports.Handlebars = Handlebars;

function viewEngine(viewPath, data, callback) {
  var app, layoutData;

  data.locals = data.locals || {};
  app = data.app;
  layoutData = _.extend({}, data, {
    body: getViewHtml(viewPath, data.locals, app),
    appData: app.toJSON(),
    bootstrappedData: getBootstrappedData(data.locals, app),
    _app: app
  });
  renderWithLayout(layoutData, callback);
}

/**
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

/**
 * Cache layout template function.
 */
function getLayoutTemplate(callback) {
  var layoutPath;

  if (layoutTemplate) {
    return callback(null, layoutTemplate);
  }
  layoutPath = rendr.entryPath + "/app/templates/__layout.hbs";
  fs.readFile(layoutPath, 'utf8', function(err, str) {
    if (err) return callback(err);
    layoutTemplate = Handlebars.compile(str);
    callback(null, layoutTemplate);
  });
}

function getViewHtml(viewPath, locals, app) {
  var BaseView, View, name, view, basePath;

  basePath = path.join('app', 'views');
  BaseView = require('../shared/base/view');
  locals = _.clone(locals);

  // Pass in the app.
  locals.app = app;
  name = viewPath.substr(viewPath.indexOf(basePath) + basePath.length + 1);
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
