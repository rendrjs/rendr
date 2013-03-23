fs = require('fs') if global.isServer
handlebarsHelpers = require('./handlebarsHelpers')

templates = null

for own key, func of handlebarsHelpers
  Handlebars.registerHelper(key, func)

exports.getTemplate = (template) ->
  # Allow compiledTemplates to be created asynchronously.
  templates ||= require(rendr.entryPath + '/templates/compiledTemplates')

  filename = "#{template}.hbs"
  templates[filename]
