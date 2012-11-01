App = require('../shared/app')
Router = require('./router')

module.exports = class ClientApp extends App

  bootstrapData: (modelMap) ->
    results = {}
    for own name, map of modelMap
      modelOrCollection = @fetcher.getModelForSpec(map.summary, map.data)
      results[name] = modelOrCollection
    @fetcher.storeModels results

  start: ->
    @router = new Router(app: @)

    Backbone.history.start
      pushState: true
