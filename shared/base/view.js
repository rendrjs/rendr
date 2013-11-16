/*global rendr*/

var Backbone, BaseView, modelUtils, _;

_ = require('underscore');
Backbone = require('backbone');
modelUtils = require('../modelUtils');

if (!global.isServer) {
  Backbone.$ = window.$;
}

function noop() {}

module.exports = BaseView = Backbone.View.extend({
  initialize: function(options) {
    var obj;

    this.name = this.name || modelUtils.underscorize(this.constructor.id || this.constructor.name);
    this.parseOptions(options);
    this.postInitialize();
    if ((obj = this.model || this.collection) && this.renderOnRefresh) {
      obj.on('refresh', this.render, this);
    }

    this.render = this.render.bind(this);
  },

  /**
   * Whether or not to re-render this view when the model or collection
   * emits a 'refresh' event. Used with 'model|collection.checkFresh()'.
   */
  renderOnRefresh: false,

  postInitialize: noop,

  parseOptions: function(options) {
    /**
     * Populate `this.options` and alias as `options`.
     */
    options = _.extend(this.options, options || {});

    if (options.app != null) {
      this.app = this.options.app;
    }

    if (options.parentView != null) {
      this.parentView = options.parentView;
    }

    if (options.model != null) {
      if (!(options.model instanceof Backbone.Model) && options.model_name) {
        options.model = modelUtils.getModel(options.model_name, options.model, {
          parse: true
        });
      }
      options.model_name = options.model_name || modelUtils.modelName(options.model.constructor);
      options.model_id = options.model.id;
    }

    if (options.collection != null) {
      options.collection_name = options.collection_name || modelUtils.modelName(options.collection.constructor);
      options.collection_params = options.collection.params;
    }

    this.model = options.model;
    this.collection = options.collection;
  },

  /**
   * Key for the template
   */
  name: null,

  /**
   * Parent of the current view.
   * We make sure to stick this on the prototype as a runtime optimization
   * for V8. It's best not to add properties to the instance after initialization.
   */
  parentView: null,

  /**
   * Children of the current view.
   */
  childViews: null,

  /**
   * Flag whether or not the view is currently being viewed
   */
  viewing: false,

  /**
   * Gets array of child views by their name
   * Empty array is returned when no match is found
   */
  getChildViewsByName: function(name) {
    return _.where(this.childViews, {name: name});
  },

  /**
   * Get data for template.  This also acts as a view-model.
   * Try to return proper data if model or collection is available.
   */
  getTemplateData: function() {
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
  },

  /**
   * Add special properties `_app` and `_model` or `_collection` to pass to
   * the templates.
   */
  decorateTemplateData: function(data) {
    if (this.app) {
      data._app = this.app;
    }
    if (this.model) {
      data._model = this.model;
    }
    if (this.collection) {
      data._collection = this.collection;
    }
    data._view = this;
    return data;
  },

  getTemplateName: function() {
    return this.options.template_name || this.name;
  },

  /**
   * Get template function
   */
  getTemplate: function() {
    return this.app.templateAdapter.getTemplate(this.getTemplateName());
  },

  /**
   * Any options not to create data-attributes for.
   */
  nonAttributeOptions: ['id', 'className', 'tagName'],

  /**
   * Get HTML attributes to add to el.
   */
  getAttributes: function() {
    var attributes = {}, fetchSummary = {};

    if (this.attributes) {
      _.extend(attributes, _.result(this, 'attributes'));
    }
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
      var id, modelOrCollectionId;

      if (value != null) {
        if (_.isFunction(value.constructor) && value.constructor.id != null) {
          modelOrCollectionId = value.constructor.id;
          if (modelUtils.isModel(value)) {
            id = value.get(value.idAttribute);
            if (id == null) {
              // Bail if there's no ID; someone's using `this.model` in a
              // non-standard way, and that's okay.
              return;
            }
            // Cast the `id` attribute to string to ensure it's included in attributes.
            // On the server, it can be i.e. an `ObjectId` from Mongoose.
            value = id.toString();
            fetchSummary[key] = {model: modelOrCollectionId, id: value};
            return;
          }
          if (modelUtils.isCollection(value) && value.params != null) {
            fetchSummary[key] = {collection: modelOrCollectionId, params: value.params};
            return;
          }
        }
        if (!_.isObject(value) && !_.include(this.nonAttributeOptions, key)) {
          attributes["data-" + key] = value;
        }
      }
    });

    if (!_.isEmpty(fetchSummary)) {
      attributes['data-fetch_summary'] = JSON.stringify(fetchSummary);
    }
    return attributes;
  },

  /**
   * Turn template into HTML, minus the wrapper element.
   */
  getInnerHtml: function() {
    var data, template;

    this._preRender();
    data = this.getTemplateData();
    data = this.decorateTemplateData(data);
    template = this.getTemplate();
    if (template == null) {
      throw new Error(this.name + ": template \"" + this.getTemplateName() + "\" not found.");
    }
    return template(data);
  },

  /**
   * Get the HTML for the view, including the wrapper element.
   */
  getHtml: function() {
    var attrString, attributes, html;

    html = this.getInnerHtml();
    attributes = this.getAttributes();
    attrString = _.inject(attributes, function(memo, value, key) {
      return memo += " " + key + "=\"" + _.escape(value) + "\"";
    }, '');
    return "<" + this.tagName + attrString + ">" + html + "</" + this.tagName + ">";
  },

  render: function() {
    var html;

    html = this.getInnerHtml();
    this.$el.html(html);

    // Because we only set the attributes of the outer element
    // when calling getHtml() (server), let's make sure it also
    // happens during render() (client).

    this.$el.attr(this.getAttributes());
    this._postRender();
    return this;
  },

  /**
   * If rendered on the client missing its data,
   * fetch it based on the parameters passed in.
   */
  fetchLazy: function() {
    var fetchSpec, params;

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
    this.app.fetch(fetchSpec, this._fetchLazyCallback.bind(this));
  },

  _fetchLazyCallback: function(err, results) {
    this.setLoading(false);
    if (err) {
      console.log("FETCH ERR: " + err);
    } else if (this.viewing) {
      // It's possible that by the time the XHR returns, the user has navigated
      // away to a new page, check for whether we are viewing first
      this.parseOptions(results);
      this.render();
    }
  },

  /**
   * Anything to do before rendering on the client or server.
   * This is useful for i.e. accessing @model in the client after
   * @hydrate() is called, but before @getTemplateData() is called.
   */
  _preRender: function() {
    this.preRender();
    this.trigger('preRender');
  },

  /**
   * Anything to do after rendering on the client, such initializing jQuery
   * plugins like sliders, slideshows, etc.
   */
  _postRender: function() {
    this.attachChildViews();
    this.postRender();
    this.trigger('postRender');
  },

  /**
   * To be overridden by subclasses.
   */
  preRender: noop,

  /**
   * To be overridden by subclasses.
   */
  postRender: noop,

  /**
   * Hydrate this view with the data it needs, if being attached
   * to pre-exisitng DOM.
   */
  hydrate: function() {
    var fetchSummary, results;

    fetchSummary = this.options.fetch_summary;
    if (!_.isEmpty(fetchSummary)) {
      results = this.app.fetcher.hydrate(fetchSummary, {
        app: this.app
      });
      this.parseOptions(results);
    }
  },

  setLoading: function(loading) {
    this.$el.toggleClass('loading', loading);
    this.trigger('loading', loading);
  },

  /**
   * When HTML is already present (rendered by server),
   * this is what gets called to bind to the element.
   */
  attach: function(element, parentView) {
    var $el;

    $el = $(element);
    $el.data('view-attached', true);
    this.setElement($el);

    /**
     * Store a reference to the parent view.
     */
    this.parentView = parentView;

    /**
     * When the view is attached, flip viewing to true
     */
    this.viewing = true;

    /**
     * Hydrate looks if there is a model or collection associated
     * with this view, and tries to load it from memory.
     */
    this.hydrate();

    /**
     * Call preRender() so we can access things setup by @hydrate()
     * (like @model) in i.e. @getTemplateData().
     */
    this._preRender();

    /**
     * We have to call postRender() so client-only things happen,
     * i.e. initialize slideshows, etc.
     */
    this._postRender();

    /**
     * If the view says it should try to be lazy loaded, and it doesn't
     * have a model or collection, then do so.
     */
    if (this.options.lazy === true && this.options.collection == null && this.options.model == null) {
      this.fetchLazy();
    }
    this.trigger('attach');
  },

  /**
   * Happens client-side.
   * Find all of sub view DOM elements
   * Get the view key
   * Call this.getView()
   * Attach childView
   */
  attachChildViews: function() {
    // Remove all child views in case we are re-rendering through
    // manual .render() or 'refresh' being triggered on the view.
    this.removeChildViews();
    this.childViews = BaseView.attach(this.app, this);
  },

  removeChildViews: function() {
    (this.childViews || []).forEach(function(view) {
      view.remove();
    });
  },

  remove: function() {
    this.removeChildViews();
    this.childViews = null;
    this.parentView = null;
    this.viewing = false;

    var obj = this.model || this.collection;

    if (obj) {
      obj.off(null, null, this);
    }
    BaseView.__super__.remove.apply(this, arguments);
    this.trigger('remove');
  }
});

/**
 * Class methods
 * -------------
 */

BaseView.getView = function(viewName) {
  return require(rendr.entryPath + "app/views/" + viewName);
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

/**
 * Noops on the server, because they do DOM stuff.
 */
if (typeof window === 'undefined') {
  BaseView.prototype._ensureElement = noop;
  BaseView.prototype.delegateEvents = noop;
}
