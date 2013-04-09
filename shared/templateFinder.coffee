handlebarsHelpers = require('./handlebarsHelpers')

templates = null

for own key, func of handlebarsHelpers
  Handlebars.registerHelper(key, func)

exports.getTemplate = (templateName) ->
  # Allow compiledTemplates to be created asynchronously.
  templates ||= require(rendr.entryPath + '/app/templates/compiledTemplates')(Handlebars)
  templates[templateName]
