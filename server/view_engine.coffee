path = require('path')
fs = require('fs')
_ = require('underscore')
BaseView = require('../shared/base/view')

layoutPath = "#{rendr.entryPath}/templates/layout.hbs"

fetcher = require('../shared/fetcher')

module.exports = (viewPath, data, callback) ->
  data.locals ||= {}

  layoutData = _.extend {}, data,
    body: getViewHtml(viewPath, data.locals, data.app)
    bootstrappedData: getBootstrappedData(data.locals)
    _app: data.app

  renderWithLayout(layoutData, callback)

# render with a layout
renderWithLayout = (locals, cb) ->
  fs.readFile layoutPath, 'utf8', (err, str) ->
    return cb(err) if (err)

    templateFn = Handlebars.compile(str)
    html = templateFn(locals)
    cb(null, html)

getViewHtml = (viewPath, locals, app) ->
  locals = _.clone locals
  # Pass in the app.
  locals.app = app

  name = path.basename(viewPath).replace('.coffee', '')
  View = BaseView.getView(name)
  view = new View(locals)
  view.getHtml()

getBootstrappedData = (locals) ->
  bootstrappedData = {}
  for own name, modelOrCollection of locals
    bootstrappedData[name] =
      summary: fetcher.summarize(modelOrCollection)
      data: modelOrCollection.toJSON()
