BaseView = null
modelUtils = null
templateFinder = require('./templateFinder')

# Temporary, to fix bug in Handlebars
# SEE https://github.com/wycats/handlebars.js/issues/342
Handlebars.log ||= (obj) -> console.log obj

module.exports =
  view: (viewName, block) ->
    BaseView ||= require('./base/view')
    modelUtils ||= require('./modelUtils')

    viewName = modelUtils.underscorize(viewName)

    options = block.hash || {}

    app = @_app
    options.app = app if app?

    # get the Backbone.View based on viewName
    ViewClass = BaseView.getView(viewName)
    view = new ViewClass(options)

    # create the outerHTML using className, tagName
    html = view.getHtml()
    new Handlebars.SafeString(html)

  partial: (templateName, block) ->
    template = templateFinder.getTemplate(templateName)

    options = block.hash || {}
    data = if _.isEmpty(options)
        this
      else if options.context
        options.context
      else
        options

    data = _.clone(data)
    data._app ||= @_app

    html = template(data)
    new Handlebars.SafeString(html)

  json: (object) ->
    new Handlebars.SafeString JSON.stringify(object) || 'null'
