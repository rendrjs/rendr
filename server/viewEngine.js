var path = require('path'),
    _ = require('underscore'),
    layoutTemplates = {};

module.exports = exports = ViewEngine;

function ViewEngine(options) {
  this.options = options || {};

  /**
   * Ensure `render` is bound to this instance, because it can be passed around.
   */
  this.render = this.render.bind(this);
}

ViewEngine.prototype.render = function render(viewPath, data, callback) {
  var app, layoutData;

  data.locals = data.locals || {};
  app = data.app;
  layoutData = _.extend({}, data, {
    body: this.getViewHtml(viewPath, data.locals, app),
    appData: app.toJSON(),
    bootstrappedData: this.getBootstrappedData(data.locals, app),
    _app: app
  });
  this.renderWithLayout(layoutData, app, callback);
};

/**
 * Render with a layout.
 */
ViewEngine.prototype.renderWithLayout = function renderWithLayout(locals, app, callback) {
  this.getLayoutTemplate(app, function(err, templateFn) {
    if (err) return callback(err);
    var html = templateFn(locals);
    callback(null, html);
  });
};

/**
 * Cache layout template function.
 */
ViewEngine.prototype.getLayoutTemplate = function getLayoutTemplate(app, callback) {
  if (layoutTemplates[app.options.entryPath]) {
    return callback(null, layoutTemplates[app.options.entryPath]);
  }
  app.templateAdapter.getLayout('__layout', app.options.entryPath, function(err, template) {
    if (err) return callback(err);
    layoutTemplates[app.options.entryPath] = template;
    callback(err, template);
  });
};

ViewEngine.prototype.getViewHtml = function getViewHtml(viewPath, locals, app) {
  var basePath = path.join('app', 'views'),
      BaseView = require('../shared/base/view'),
      name,
      View,
      view;

  locals = _.clone(locals);

  // Pass in the app.
  locals.app = app;
  name = viewPath.substr(viewPath.indexOf(basePath) + basePath.length + 1);
  View = BaseView.getView(name, app.options.entryPath);
  view = new View(locals);
  return view.getHtml();
};

ViewEngine.prototype.getBootstrappedData = function getBootstrappedData(locals, app) {
  var bootstrappedData = {};

  _.each(locals, function(modelOrCollection, name) {
    if (app.modelUtils.isModel(modelOrCollection) || app.modelUtils.isCollection(modelOrCollection)) {
      bootstrappedData[name] = {
        summary: app.fetcher.summarize(modelOrCollection),
        data: modelOrCollection.toJSON()
      };
    }
  });
  return bootstrappedData;
};

ViewEngine.prototype.clearCachedLayouts = function () {
  layoutTemplates = {};
};
