if window?
  window.isServer = false
  window.global = window
  global.rendr = {entryPath:''}
else
  global.isServer = true
  require('../server/server').initGlobals()
