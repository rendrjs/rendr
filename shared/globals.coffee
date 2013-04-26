if window?
  window.isServer = false
  window.global = window
  global.rendr =
    entryPath: ''
else
  global.isServer = true
  global.rendr =
    entryPath: process.cwd()
