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
  global.Polyglot = require('node-polyglot')
  global.rendr.entryPath = require('../config/environments/paths').entryPath;
  global.rendr.staticDir = require('../config/environments/paths').staticDir;
else
  global.rendr.entryPath = ''
