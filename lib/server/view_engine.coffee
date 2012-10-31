IsoView = require('../app/views/iso_view')
path = require('path')
fs = require('fs')
Handlebars = require('handlebars')
_ = require('underscore')

layout_path = "#{__dirname}/../app/templates/layout.hbs"
cache = {}

fetcher = require('../app/fetcher')

module.exports = (view_path, data, callback) ->
  data.locals ||= {}

  viewLocals = _.clone data.locals

  # Pass in the app.
  viewLocals.app = data.app

  bootstrappedLocals = _.clone data.locals

  view_key = path.basename(view_path).replace('.coffee', '')
  View = IsoView.getView(view_key)
  view = new View(viewLocals)
  view_html = view.getHtml()

  bootstrappedData = {}
  for own name, modelOrCollection of bootstrappedLocals
    bootstrappedData[name] =
      summary: fetcher.summarize(modelOrCollection)
      data: modelOrCollection.toJSON()

  layoutData =
    body: view_html
    bootstrappedData: JSON.stringify(bootstrappedData)
    globalConfig: JSON.stringify(data.req.globalConfig)
    currentUser: JSON.stringify(data.req.currentUser)
    _app: data.app

  render_with_layout(layoutData, callback)

  # render with a layout
render_with_layout = (locals, cb) ->
  fs.readFile layout_path, 'utf8', (err, str) ->
    return cb(err) if (err)

    layout_template = Handlebars.compile(str)
    cache[layout_path] = layout_template

    html = layout_template(locals)
    cb(null, html)

