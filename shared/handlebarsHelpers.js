var BaseView, Handlebars, modelUtils, templateFinder, _;

templateFinder = require('./templateFinder');
Handlebars = require('handlebars');
_ = require('underscore');

// Lazy-required.
BaseView = null;
modelUtils = null;

module.exports = {
  view: function(viewName, block) {
    var ViewClass, html, options, view;

    BaseView = BaseView || require('./base/view');
    modelUtils = modelUtils || require('./modelUtils');
    viewName = modelUtils.underscorize(viewName);
    options = block.hash || {};

    // Pass through a reference to the app.
    if (this._app) {
      options.app = this._app;
    }

    // Pass through a reference to the parent view.
    if (this._view) {
      options.parentView = this._view;
    }

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
  },

  /**
   * Extend `each` to pass through important context. By default, `each` calls
   * `options.fn` without a calling context.
   */
  each: function(context, options) {
    var callingContext = getOptionsFromContext(this);
    // Make sure `this._app`, `this._view`, etc are available.
    options.fn = options.fn.bind(callingContext);
    // Call the original helper with new context.
    Handlebars.helpers.each.call(this, context, options);
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