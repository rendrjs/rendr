/*global rendr*/

var Backbone, BaseView, modelUtils, templateFinder, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('underscore');
Backbone = require('backbone');
templateFinder = require('../templateFinder');
modelUtils = require('../modelUtils');

function noop() {}

module.exports = BaseView = (function(_super) {
  __extends(BaseView, _super);

  /*
  * Whether or not to re-render this view when the model or collection
  * emits a 'refresh' event. Used with 'model|collection.checkFresh()'.
  */
  BaseView.prototype.renderOnRefresh = false;

  function BaseView(options) {
    this.render = _.bind(this.render, this);
    var obj;

    BaseView.__super__.constructor.apply(this, arguments);
    this.name = this.name || modelUtils.underscorize(this.constructor.id || this.constructor.name);
    this.parseOptions(options);
    this.postInitialize();
    if ((obj = this.model || this.collection) && this.renderOnRefresh) {
      obj.on('refresh', this.render, this);
    }
  }

  BaseView.prototype.postInitialize = noop;

  BaseView.prototype.parseOptions = function(options) {
    var _base1;

    options = options || {};
    _.extend(this.options, options);
    this.app = this.options.app;
    if (this.options.model != null) {
      if (!(this.options.model instanceof Backbone.Model) && this.options.model_name) {
        this.options.model = modelUtils.getModel(this.options.model_name, this.options.model, {
          parse: true
        });
      }
      this.options.model_name = this.options.model_name || modelUtils.modelName(this.options.model.constructor);
      this.options.model_id = this.options.model.id;
    }
    if (this.options.collection != null) {
      this.options.collection_name = this.options.collection_name || modelUtils.modelName(this.options.collection.constructor);
      this.options.collection_params = this.options.collection.params;
    }
    this.model = this.options.model;
    this.collection = this.options.collection;
  };

  /*
  * Key for the template
  */
  BaseView.prototype.name = null;

  /*
  * Parent of the current view.
  * We make sure to stick this on the prototype as a runtime optimization
  * for V8. It's best not to add properties to the instance after initialization.
  */
  BaseView.prototype.parentView = null;

  /*
  * Children of the current view.
  */
  BaseView.prototype.childViews = null;

  /*
  * Gets array of child views by their name
  * Empty array is returned when no match is found
  */
  BaseView.prototype.getChildViewsByName = function(name) {
    return _.where(this.childViews, {name: name});
  };

  /*
  * Get data for template.  This also acts as a view-model.
  * Try to return proper data if model or collection is available.
  */
  BaseView.prototype.getTemplateData = function() {
    if (this.model) {
      return this.model.toJSON();
    } else if (this.collection) {
      return {
        models: this.collection.toJSON(),
        meta: this.collection.meta,
        params: this.collection.params
      };
    } else {
      return _.clone(this.options);
    }
  };

  /*
  * Add special properties `_app` and `_model` or `_collection` to pass to
  * the templates.
  */
  BaseView.prototype.decorateTemplateData = function(data) {
    if (this.app) {
      data._app = this.app;
    }
    if (this.model) {
      data._model = this.model;
    }
    if (this.collection) {
      data._collection = this.collection;
    }
    return data;
  };

  BaseView.prototype.getTemplateName = function() {
    return this.options.template_name || this.name;
  };

  /*
  * Get template function
  */
  BaseView.prototype.getTemplate = function() {
    return templateFinder.getTemplate(this.getTemplateName());
  };

  /*
  * Any options not to create data-attributes for.
  */
  BaseView.prototype.nonAttributeOptions = ['id', 'className', 'tagName'];

  /*
  * Get HTML attributes to add to el.
  */
  BaseView.prototype.getAttributes = function() {
    var attributes = {};

    if (this.id) {
      attributes.id = this.id;
    }
    if (this.className) {
      attributes['class'] = this.className;
    }

    // Add `data-view` attribute with view key.
    // For now, view key is same as template.
    attributes['data-view'] = this.name;

    // Add model & collection meta data from options,
    // as well as any non-object option values.
    _.each(this.options, function(value, key) {
      if (value != null) {
        if (key === 'model') {
          key = 'model_id';
          value = value.id;
        } else if (key === 'collection') {
          key = 'collection_params';
          value = _.escape(JSON.stringify(value.params));
        }
        if (!_.isObject(value) && !_.include(this.nonAttributeOptions, key)) {
          attributes["data-" + key] = _.escape(value);
        }
      }
    });

    return attributes;
  };

  /*
  * Turn template into HTML, minus the wrapper element.
  */
  BaseView.prototype.getInnerHtml = function() {
    var data, template;

    this._preRender();
    data = this.getTemplateData();
    data = this.decorateTemplateData(data);
    template = this.getTemplate();
    if (template == null) {
      throw new Error(this.name + ": template \"" + this.getTemplateName() + "\" not found.");
    }
    return template(data);
  };

  /*
  * Get the HTML for the view, including the wrapper element.
  */
  BaseView.prototype.getHtml = function() {
    var attrString, attributes, html;

    html = this.getInnerHtml();
    attributes = this.getAttributes();
    attrString = _.reduce(attributes, function(memo, value, key) {
      return memo += " " + key + "=\"" + value + "\"";
    }, '');
    return "<" + this.tagName + attrString + ">" + html + "</" + this.tagName + ">";
  };

  BaseView.prototype.render = function() {
    var html;

    html = this.getInnerHtml();
    this.$el.html(html);

    // Because we only set the attributes of the outer element
    // when calling getHtml() (server), let's make sure it also
    // happens during render() (client).

    this.$el.attr(this.getAttributes());
    this._postRender();
    return this;
  };

  /*
  * If rendered on the client missing its data,
  * fetch it based on the parameters passed in.
  */
  BaseView.prototype.fetchLazy = function() {
    var fetchSpec, params,
      _this = this;

    params = {};
    params[this.options.param_name] = this.options.param_value;
    if (this.options.model_id != null) {
      params.id = this.options.model_id;
    }
    if (this.options.model_name != null) {
      fetchSpec = {
        model: {
          model: this.options.model_name,
          params: params
        }
      };
    } else if (this.options.collection_name != null) {
      fetchSpec = {
        collection: {
          collection: this.options.collection_name,
          params: params
        }
      };
    }
    this.setLoading(true);
    this.app.fetch(fetchSpec, function(err, results) {
      _this.setLoading(false);
      if (err) {
        console.log("FETCH ERR: " + err);
      } else {
        // Check this.parentView as a way to see if view is still present on the page.
        // It's possible that by the time the XHR returns, the user has navigated
        // away to a new page.
        if (_this.parentView != null) {
          _this.parseOptions(results);
          _this.render();
        }
      }
    });
  };

  /*
  * Anything to do before rendering on the client or server.
  * This is useful for i.e. accessing @model in the client after
  * @hydrate() is called, but before @getTemplateData() is called.
  */
  BaseView.prototype._preRender = function() {
    this.preRender();
    this.trigger('preRender');
  };

  /*
  * Anything to do after rendering on the client, such initializing jQuery
  * plugins like sliders, slideshows, etc.
  */
  BaseView.prototype._postRender = function() {
    this.attachChildViews();
    this.postRender();
    this.trigger('postRender');
  };

  /*
  * To be overridden by subclasses.
  */
  BaseView.prototype.preRender = noop;

  /*
  * To be overridden by subclasses.
  */
  BaseView.prototype.postRender = noop;

  /*
  * Hydrate this view with the data it needs, if being attached
  * to pre-exisitng DOM.
  */
  BaseView.prototype.hydrate = function() {
    var fetchSummary, results;

    fetchSummary = {};
    if (this.options.model_name != null && this.options.model_id != null) {
      fetchSummary.model = {
        model: this.options.model_name,
        id: this.options.model_id
      };
    }
    if (this.options.collection_name != null && this.options.collection_params != null) {
      fetchSummary.collection = {
        collection: this.options.collection_name,
        params: this.options.collection_params
      };
    }
    if (!_.isEmpty(fetchSummary)) {
      results = this.app.fetcher.hydrate(fetchSummary, {
        app: this.app
      });
      this.parseOptions(results);
    }
  };

  BaseView.prototype.setLoading = function(loading) {
    this.$el.toggleClass('loading', loading);
    this.trigger('loading', loading);
  };

  /*
  * When HTML is already present (rendered by server),
  * this is what gets called to bind to the element.
  */
  BaseView.prototype.attach = function(element, parentView) {
    var $el;

    $el = $(element);
    $el.data('view-attached', true);
    this.setElement($el);

    /*
    * Store a reference to the parent view.
    */
    this.parentView = parentView;

    /*
    * Hydrate looks if there is a model or collection associated
    * with this view, and tries to load it from memory.
    */
    this.hydrate();

    /*
    * Call preRender() so we can access things setup by @hydrate()
    * (like @model) in i.e. @getTemplateData().
    */
    this._preRender();

    /*
    * We have to call postRender() so client-only things happen,
    * i.e. initialize slideshows, etc.
    */
    this._postRender();

    /*
    * If the view says it should try to be lazy loaded, and it doesn't
    * have a model or collection, then do so.
    */
    if (this.options.lazy === true && this.options.collection == null && this.options.model == null) {
      this.fetchLazy();
    }
    this.trigger('attach');
  };

  /*
  * Happens client-side.
  * Find all of sub view DOM elements
  * Get the view key
  * Call this.getView()
  * Attach childView
  */
  BaseView.prototype.attachChildViews = function() {
    // Remove all child views in case we are re-rendering through
    // manual .render() or 'refresh' being triggered on the view.
    this.removeChildViews();
    this.childViews = BaseView.attach(this.app, this);
  };

  BaseView.prototype.removeChildViews = function() {
    _.each(this.childViews || [], function(view) {
      view.remove();
    });
  };

  BaseView.prototype.remove = function() {
    var obj;

    this.removeChildViews();
    this.childViews = null;
    this.parentView = null;
    if (obj = this.model || this.collection) {
      obj.off(null, null, this);
    }
    BaseView.__super__.remove.apply(this, arguments);
    this.trigger('remove');
  };

  /*
  * Class methods
  * -------------
  */

  BaseView.getView = function(viewName) {
    return require(rendr.entryPath + ("/app/views/" + viewName));
  };

  BaseView.attach = function(app, parentView) {
    var scope, views;
    scope = parentView != null ? parentView.$el : null;
    views = $('[data-view]', scope).map(function(i, el) {
      var $el, ViewClass, options, parsed, view, viewName;

      $el = $(el);
      if (!$el.data('view-attached')) {
        options = $el.data();
        viewName = options.view;
        _.each(options, function(value, key) {
          if (_.isString(value)) {
            parsed = _.unescape(value);
            try {
              parsed = JSON.parse(parsed);
            } catch (err) {}
            options[key] = parsed;
          }
        });
        options.app = app;
        ViewClass = BaseView.getView(viewName);
        view = new ViewClass(options);
        view.attach($el, parentView);
        return view;
      }
    });
    return _.compact(views);
  };

  return BaseView;

})(Backbone.View);

/*
* Noops on the server, because they do DOM stuff.
*/
if (global.isServer) {
  BaseView.prototype._ensureElement = noop;
  BaseView.prototype.delegateEvents = noop;
}
