var BaseView, Handlebars, modelUtils, templateFinder, _;

templateFinder = require('./templateFinder');
Handlebars = require('handlebars');
_ = require('underscore');

// Lazy-required.
BaseView = null;
modelUtils = null;

var oldEach = Handlebars.helpers.each;

module.exports = {
  view: function(viewName, block) {
    var ViewClass, html, options, view, data;

    BaseView = BaseView || require('./base/view');
    modelUtils = modelUtils || require('./modelUtils');
    viewName = modelUtils.underscorize(viewName);
    options = block.hash || {};
    data = block.data || {};

    // Pass through a reference to the app.
    var app = this._app || data._app;
    if (app) {
      options.app = app;
    }

    // Pass through a reference to the parent view.
    parentView = this._view || data._view
    if (parentView) {
      options.parentView = parentView;
    }

    // get the Backbone.View based on viewName
    ViewClass = BaseView.getView(viewName);
    view = new ViewClass(options);

    // create the outerHTML using className, tagName
    html = view.getHtml();

    // remove view as its parentView will re-create it from data-view attributes present in html
    if (typeof window !== 'undefined') {
        view.remove();
    }

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
  },

  /**
   * Extend `each` to pass through important context.
   */
  each: function(context, options) {
    options.data = Handlebars.createFrame(options.data || {});

    // Make sure `this._app`, `this._view`, etc are available.
    _.extend(options.data, getOptionsFromContext(this));

    // Call the original helper with new context.
    return oldEach.call(this, context, options);
  }
};

/**
 * Grab important underscored properties from the current context.
 * These properties come from BaseView::decorateTemplateData().
 */
function getOptionsFromContext(obj) {
  var options, keys, value;

  keys = [
    '_app',
    '_view',
    '_model',
    '_collection'
  ];

  options = keys.reduce(function(memo, key) {
    value = obj[key];
    if (value) {
      memo[key] = value;
    }
    return memo;
  }, {});

  return options;
}