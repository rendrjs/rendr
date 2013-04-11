if window?
  window.isServer = false
  window.global = window
  global.rendr =
    entryPath: ''
else
  global.isServer = true
  global._ = require('underscore')
  global.Backbone = require('backbone')
  global.Handlebars = require('handlebars')
  global.rendr =
    entryPath: process.cwd()
