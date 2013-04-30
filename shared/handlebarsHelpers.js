var BaseView, Handlebars, modelUtils, templateFinder, _;

templateFinder = require('./templateFinder');
Handlebars = require('handlebars');
_ = require('underscore');

// Lazy-required.
BaseView = null;
modelUtils = null;

module.exports = {
  view: function(viewName, block) {
    var ViewClass, app, html, options, view;

    BaseView = BaseView || require('./base/view');
    modelUtils = modelUtils || require('./modelUtils');
    viewName = modelUtils.underscorize(viewName);
    options = block.hash || {};
    app = this._app;
    if (app != null) {
      options.app = app;
    }

    // Pass through a reference to the parent view.
    options.parentView = this._view;

    // get the Backbone.View based on viewName
    ViewClass = BaseView.getView(viewName);
    view = new ViewClass(options);

    // create the outerHTML using className, tagName
    html = view.getHtml();
    return new Handlebars.SafeString(html);
  },

  partial: function(templateName, block) {
    var data, html, options, template;

    template = templateFinder.getTemplate(templateName);
    options = block.hash || {};
    data = _.isEmpty(options) ? this : options.context ? options.context : options;
    data = _.clone(data);
    data._app = data._app || this._app;
    html = template(data);
    return new Handlebars.SafeString(html);
  },

  json: function(object) {
    return new Handlebars.SafeString(JSON.stringify(object) || 'null');
  }
};
