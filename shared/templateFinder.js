/*global rendr*/

var Handlebars, handlebarsHelpers, templates;

Handlebars = require('handlebars');
handlebarsHelpers = require('./handlebarsHelpers');

for (var key in handlebarsHelpers) {
  if (!handlebarsHelpers.hasOwnProperty(key)) continue;
  Handlebars.registerHelper(key, handlebarsHelpers[key]);
}

templates = null;

exports.getTemplate = function(templateName) {
  /**
   * Allow compiledTemplates to be created asynchronously.
   */
  templates = templates || require(rendr.entryPath + '/app/templates/compiledTemplates')(Handlebars);
  return templates[templateName];
};

