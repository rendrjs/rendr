fs = require('fs')
path = require('path')

# Set up each middleware file in this directory as a property
# on exports. This means you can require this file and access
# each middleware like so:
#
#   middleware = require('rendr/server/middleware')
#   expressApp.use(middleware.initApp(attributes))
#
fs.readdirSync(__dirname).forEach (filename) ->
  name = path.basename(filename, '.coffee')
  return if name is 'index' or name[0] is '_'
  load = -> require("./#{name}")
  exports.__defineGetter__(name, load)
