BaseView = require('./view')

hasPushState = window?.history.pushState?

module.exports = class AppView extends BaseView
  el: 'body'

  initialize: ->
    super
    @app = @options.app
    _.defaults @options,
      contentEl: '#content'

    # Grab the element that contains the main view.
    @$content = $(@options.contentEl)

    @_bindInterceptClick()

  render: ->

  setCurrentView: (view) ->
    @$content.html(view.el)
    view.render()

  _bindInterceptClick: ->
    @$el.on 'click', 'a:not([data-pass-thru])', @_interceptClick

  _interceptClick: (e) =>
    # We want the actual value of the attribute, rather than the
    # full URL, so we use jQuery instead of just e.currentTarget.href
    href = $(e.currentTarget).attr('href')
    if @shouldInterceptClick(href, e.currentTarget)
      e.preventDefault()
      @app.router.redirectTo(href)

  shouldInterceptClick: (href, el) ->
    return false unless href && hasPushState
    hashParts = href.split('#')
    isHashClick = hashParts.length > 1 && hashParts[0] == window.location.pathname
    !isHashClick && href.slice(0, 1) == '/' && href.slice(0, 2) != '//'
