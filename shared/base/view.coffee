templateFinder = require('../templateFinder')
modelUtils = require('../modelUtils')

noop = ->

module.exports = class BaseView extends Backbone.View

  # Whether or not to re-render this view when the model or collection
  # emits a 'refresh' event. Used with 'model|collection.checkFresh()'.
  renderOnRefresh: false

  constructor: (options) ->
    super
    @name ||= modelUtils.underscorize(@constructor.id || @constructor.name)
    @parseOptions(options)
    @postInitialize()

    if (obj = @model || @collection) && @renderOnRefresh
      obj.on 'refresh', @render, @

  postInitialize: noop

  parseOptions: (options = {}) ->
    _.extend @options, options

    @app = @options.app

    if @options.model?
      if !(@options.model instanceof Backbone.Model) && @options.model_name
        @options.model = modelUtils.getModel(@options.model_name, @options.model, {parse:true})

      @options.model_name ||= modelUtils.modelName(@options.model.constructor)
      @options.model_id = @options.model.id

    if @options.collection?
      @options.collection_name ||= modelUtils.modelName(@options.collection.constructor)
      @options.collection_params = @options.collection.params

    @model = @options.model
    @collection = @options.collection

  # Key for the template
  name: null

  # Parent of the current view.
  # We make sure to stick this on the prototype as a runtime optimization
  # for V8. It's best not to add properties to the instance after initialization.
  parentView: null

  # Children of the current view.
  childViews: null

  # Gets array of child views by their name
  # Empty array is returned when no match is found
  getChildViewsByName: (name) ->
    _.where(@childViews, {name})

  # Get data for template.  This also acts as a view-model.
  # Try to return proper data if model or collection is available.
  getTemplateData: ->
    if @model
      @model.toJSON()
    else if @collection
      models: @collection.toJSON()
      meta: @collection.meta
      params: @collection.params
    else
      _.clone @options

  decorateTemplateData: (data) ->
    data._app = @app if @app
    data._model = @model if @model
    data._collection = @collection if @collection
    data

  getTemplateName: ->
    @options.template_name || @name

  # Get template function
  getTemplate: ->
    templateFinder.getTemplate(@getTemplateName())

  # Any options not to create data-attributes for.
  nonAttributeOptions: [
    'id'
    'className'
    'tagName'
  ]

  # Get HTML attributes to add to el.
  getAttributes: ->
    attributes = {}
    attributes['id'] = @id if @id
    attributes['class'] = @className if @className
    # Add `data-view` attribute with view key.
    # For now, view key is same as template.
    attributes['data-view'] = @name
    for own key, value of @options
      if value?
        if key is 'model'
          key = 'model_id'
          value = value.id
        else if key is 'collection'
          key = 'collection_params'
          value = _.escape(JSON.stringify(value.params))
        if !_.isObject(value) && !_.include(@nonAttributeOptions, key)
          attributes["data-#{key}"] = _.escape(value)

    attributes

  # Turn template into HTML, minus the wrapper element.
  getInnerHtml: ->
    @_preRender()
    data = @getTemplateData()
    data = @decorateTemplateData(data)
    template = @getTemplate()
    throw new Error("#{@name}: template \"#{@getTemplateName()}\" not found.") unless template?
    template(data)

  # Get the HTML for the view, including the wrapper element.
  getHtml: ->
    html = @getInnerHtml()
    attributes = @getAttributes()
    attrString = _.reduce(attributes, (memo, value, key) ->
      memo += " #{key}=\"#{value}\""
    , '')
    "<#{@tagName}#{attrString}>#{html}</#{@tagName}>"

  render: =>
    html = @getInnerHtml()
    @$el.html html
    # Because we only set the attributes of the outer element
    # when calling getHtml() (server), let's make sure it also
    # happens during render() (client).
    @$el.attr @getAttributes()
    @_postRender()
    @

  # If rendered on the client missing its data,
  # fetch it based on the parameters passed in.
  fetchLazy: ->
    params = {}
    params[@options.param_name] = @options.param_value
    params.id = @options.model_id if @options.model_id?

    fetchSpec =
      if @options.model_name?
        model:
          model: @options.model_name
          params: params
      else if @options.collection_name?
        collection:
          collection: @options.collection_name
          params: params

    @setLoading(true)
    @app.fetch fetchSpec, (err, results) =>
      @setLoading(false)
      return console.log "FETCH ERR: #{err}" if err

      # Check @parentView as a way to see if view is still present on the page.
      # It's possible that by the time the XHR returns, the user has navigated
      # away to a new page.
      if @parentView?
        @parseOptions(results)
        @render()

  # Anything to do before rendering on the client or server.
  # This is useful for i.e. accessing @model in the client after
  # @hydrate() is called, but before @getTemplateData() is called.
  _preRender: ->
    @preRender()
    @trigger 'preRender'

  # Anything to do after rendering on the client.
  _postRender: ->
    @attachChildViews()
    @postRender()
    @trigger 'postRender'

  # To be overridden by subclasses.
  preRender: noop

  # To be overridden by subclasses.
  postRender: noop

  # Hydrate this view with the data it needs, if being attached
  # to pre-exisitng DOM.
  hydrate: ->
    fetchSummary = {}

    if @options.model_name? && @options.model_id?
      fetchSummary.model =
        model: @options.model_name
        id: @options.model_id

    if @options.collection_name? && @options.collection_params?
      fetchSummary.collection =
        collection: @options.collection_name
        params: @options.collection_params

    if !_.isEmpty(fetchSummary)
      results = @app.fetcher.hydrate(fetchSummary, {app: @app})
      @parseOptions(results)

  setLoading: (loading) ->
    @$el.toggleClass('loading', loading)
    @trigger 'loading', loading

  # When HTML is already present (rendered by server),
  # this is what gets called to bind to the element.
  attach: (element, parentView = null) ->
    $el = $(element)
    $el.data('view-attached', true)
    @setElement($el)

    # Store a reference to the parent view.
    @parentView = parentView

    # Hydrate looks if there is a model or collection associated
    # with this view, and tries to load it from memory.
    @hydrate()

    # Call preRender() so we can access things setup by @hydrate()
    # (like @model) in i.e. @getTemplateData().
    @_preRender()

    # We have to call postRender() so client-only things happen,
    # i.e. initialize slideshows, etc.
    @_postRender()

    # If the view says it should try to be lazy loaded, and it doesn't
    # have a model or collection, then do so.
    if @options.lazy is true && !@options.collection? && !@options.model?
      @fetchLazy()

    @trigger 'attach'

  # Happens client-side.
  # Find all of sub view DOM elements
  # Get the view key
  # Call @getView()
  # Attach childView
  attachChildViews: ->
    # Remove all child views in case we are re-rendering through
    # manual .render() or 'refresh' being triggered on the view.
    @removeChildViews()
    @childViews = BaseView.attach(@app, @)

  removeChildViews: ->
    view.remove() for view in @childViews || []

  remove: ->
    @removeChildViews()
    @childViews = null
    @parentView = null
    if (obj = @model || @collection)
      obj.off null, null, @
    super
    @trigger 'remove'

  # Class methods
  # -------------
  @getView: (viewName) ->
    require(rendr.entryPath + "/app/views/#{viewName}")

  @attach: (app, parentView = null) ->
    scope = parentView?.$el
    views = $('[data-view]', scope).map (i, el) =>
      $el = $(el)
      if !$el.data('view-attached')
        options = $el.data()
        viewName = options.view
        for own key, value of options
          if _.isString(value)
            parsed = _.unescape(value)
            try
              parsed = JSON.parse(parsed)
            catch e
            options[key] = parsed
        options.app = app
        ViewClass = BaseView.getView(viewName)
        view = new ViewClass(options)
        view.attach($el, parentView)
        view
    _.compact(views)


# Noops on the server, because they do DOM stuff.
if global.isServer
  BaseView::_ensureElement = noop
  BaseView::delegateEvents = noop
