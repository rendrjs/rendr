BaseView = require('./view')

module.exports = class AppView extends BaseView
  el: 'body'

  initialize: ->
    super
    @app = @options.app
    _.defaults @options,
      contentEl: '#content'

    @_bindInterceptClick()

  getTemplate: ->
    -> ''

  setCurrentView: (view) ->
    @$content ||= $(@options.contentEl)
    @$content.html(view.el)
    view.render()

  _bindInterceptClick: ->
    @$el.on 'click', 'a:not([data-pass-thru])', @_interceptClick

  _interceptClick: (e) =>
    # We want the actual value of the attribute, rather than the
    # full URL, so we use jQuery instead of just e.currentTarget.href
    href = $(e.currentTarget).attr('href')
    if href
      hashParts = href.split('#')
      isHashClick = hashParts.length > 1 && hashParts[0] == window.location.pathname
      if !isHashClick && href.slice(0, 1) == '/' && href.slice(0, 2) != '//'
        e.preventDefault()
        @app.router.navigate(href, true)
