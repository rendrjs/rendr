if window?
  window.isServer = false
  window.global = window
else
  global.isServer = true

global.rendr = {}

if isServer
  global._ = require('underscore')
  global.Backbone = require('backbone')
  global.Handlebars = require('handlebars')
  global.rendr.entryPath = require('../config/environments/paths').entryPath;
  global.rendr.manifestDir = require('../config/environments/paths').publicDir;
else
  global.rendr.entryPath = ''
