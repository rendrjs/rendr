App = require('../app')
Router = require('router')

module.exports = class ClientApp extends App

  bootstrapData: (modelMap) ->
    results = {}
    for own name, map of modelMap
      modelOrCollection = @fetcher.getModelForSpec(map.summary, map.data)
      results[name] = modelOrCollection
    @fetcher.storeModels results

  loadData: (data) ->
    for key in ['locales', 'currencies']
      console.log("loadData #{key}=", data[key])

  loadUser: (data) ->
    if data.phrases
      Polyglot.extend(data.phrases)


  start: ->
    @SessionManager.checkCachedLogin()

    @router = new Router(app: @)

    moment.lang("en")

    Backbone.history.start
      pushState: true


window.t = (key, data) ->
  Polyglot.t(key, data)
