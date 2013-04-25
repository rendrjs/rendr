path = require('path')
_ = require('underscore')

viewEngine =
  renderFile: (viewPath, data, callback) ->

    data.locals ||= {}

    app = data.app
    @layoutFinder = app.layoutFinder

    layoutData = _.extend {}, data,
      body: @getViewHtml(viewPath, data.locals, app)
      appData: app.toJSON()
      bootstrappedData: @getBootstrappedData(data.locals, app)
      _app: app

    @renderWithLayout(layoutData, callback)


  # render with a layout
  renderWithLayout: (locals, cb) ->
    @getLayoutTemplate (err, templateFn) ->
      return cb(err) if err
      html = templateFn(locals)
      cb(null, html)


  layoutTemplate: null
  # Cache layout template function.
  getLayoutTemplate: (callback) ->
    return callback(null, @layoutTemplate) if @layoutTemplate
    @layoutFinder.getTemplate('__layout', (err, template) =>
      @layoutTemplate = template
      callback(err, @layoutTemplate)
    )

  getViewHtml: (viewPath, locals, app) ->
    BaseView = require('../shared/base/view')

    locals = _.clone locals
    # Pass in the app.
    locals.app = app

    name = path.basename(viewPath).replace('.coffee', '')
    View = BaseView.getView(name)
    view = new View(locals)
    view.getHtml()


  getBootstrappedData: (locals, app) ->
    modelUtils = require('../shared/modelUtils')

    bootstrappedData = {}
    for own name, modelOrCollection of locals
      if modelUtils.isModel(modelOrCollection) or modelUtils.isCollection(modelOrCollection)
        bootstrappedData[name] =
          summary: app.fetcher.summarize(modelOrCollection)
          data: modelOrCollection.toJSON()

    bootstrappedData

module.exports = viewEngine.renderFile.bind(viewEngine)
