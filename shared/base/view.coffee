templateFinder = require('../template_finder')
model_utils = require('../model_utils')
fetcher = require('../fetcher')

noop = ->

module.exports = class BaseView extends Backbone.View

  constructor: (options) ->
    super
    @name ||= model_utils.underscorize(@constructor.name)
    @parseOptions(options)
    @postInitialize()

  postInitialize: noop

  parseOptions: (options = {}) ->
    _.extend @options, options

    @app = @options.app

    if @options.model?
      if !(@options.model instanceof Backbone.Model) && @options.model_name
        @options.model = model_utils.getModel(@options.model_name, @options.model, {parse:true})

      @options.model_name ||= model_utils.modelName(@options.model.constructor)
      @options.model_id = @options.model.id
    else if @options.collection?
      @options.collection_name ||= model_utils.modelName(@options.collection.constructor)
      @options.model_ids = @options.collection.pluck('id')

    @model = @options.model
    @collection = @options.collection

  # Key for the template
  name: null

  # Get data for template.  This also acts as a view-model.
  # Try to return proper data if model or collection is available.
  getTemplateData: ->
    if @model
      @model.toJSON()
    else if @collection
      models: @collection.toJSON()
    else
      _.clone @options

  decorateTemplateData: (data) ->
    data._app = @app if @app
    data._model = @model if @model
    data._collection = @collection if @collection
    data

  getTemplateName: ->
    @name

  # Get template function
  getTemplate: ->
    templateFinder.getTemplate(@getTemplateName())

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
          key = 'model_ids'
          value = JSON.stringify(value.pluck('id'))
        if !_.isObject(value)
          attributes["data-#{key}"] = value

    attributes

  # Turn template into HTML, minus the wrapper element.
  getInnerHtml: ->
    @_preRender()
    data = @getTemplateData()
    data = @decorateTemplateData(data)
    template = @getTemplate()
    throw new Error("#{@constructor.name}: template \"#{@getTemplateName()}\" not found.") unless template?
    template(data)

  # Get the HTML for the view, including the wrapper element.
  getHtml: ->
    html = this.getInnerHtml()
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
    @attachChildViews()
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
    fetcher.fetch fetchSpec, (err, results) =>
      @setLoading(false)
      return console.log "FETCH ERR: #{err}" if err
      @parseOptions(results)
      @render()

  # Anything to do before rendering on the client or server.
  # This is useful for i.e. accessing @model in the client after
  # @hydrate() is called, but before @getTemplateData() is called.
  _preRender: ->
    @preRender()

  # Anything to do after rendering on the client.
  _postRender: ->
    @postRender()

  # To be overridden by subclasses.
  preRender: noop

  # To be overridden by subclasses.
  postRender: noop

  # Hydrate this view with the data it needs, if being attached
  # to pre-exisitng DOM.
  hydrate: ->
    fetchSummary =
      if @options.model_name? && @options.model_id?
        model:
          model: @options.model_name
          id: @options.model_id
      else if @options.collection_name? && @options.model_ids?
        collection:
          collection: @options.collection_name
          ids: @options.model_ids

    if fetchSummary
      results = fetcher.hydrate(fetchSummary, {app: @app})
      @parseOptions(results)

  setLoading: (loading) ->
    @$el.toggleClass('loading', loading)

  # When HTML is already present (rendered by server),
  # this is what gets called to bind to the element.
  attach: (element) ->
    $el = $(element)
    $el.data('view-attached', true)
    # Save the instance on the DOM el so we can grab later
    # TODO does this cause a memory leak?
    $el.data('view-instance', @)
    @setElement($el)

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
    if @options.lazy? && !@options.collection? && !@options.model?
      @fetchLazy()

  # Happens client-side.
  # Find all of sub view DOM elements
  # Get the view key
  # Call @getView()
  # Attach childView
  attachChildViews: ->
    BaseView.attach(@app, @$el)

  remove: ->
    # TODO is this necessary or does it happen automatically when
    # DOM el is removed?
    @$el.data('view-instance', null)
    super

  # Class methods
  # -------------
  @getView: (viewName) ->
    require(rendr.entryPath + "/views/#{viewName}")

  @attach: (app, scope) ->
    $('[data-view]', scope).each (i, el) =>
      $el = $(el)
      if !$el.data('view-attached')
        viewName = $el.data('view')
        options = $el.data()
        options.app = app
        ViewClass = BaseView.getView(viewName)
        view = new ViewClass(options)
        view.attach($el)


# Noops on the server, because they do DOM stuff.
if global.isServer
  BaseView::_ensureElement = noop
  BaseView::delegateEvents = noop
