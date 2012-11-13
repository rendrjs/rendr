# 
# Config settings for NODE_ENV=development
#
paths = require('./paths')

exports.config =
  
  assetCompiler:
    enabled: true
    jsSrcPaths: [paths.rootDir + '/tmp/assetCompiler', paths.entryPath]
    stichedJsFile: paths.publicDir + '/mergedAssets.js'
    minify: false

  assets:
    publicDir: paths.publicDir
    cdn:
      protocol: 'http'
      cnames: ['0.0.0.0:3030']
      pathPrefix: '/'
    fingerprint:
      enabled: false
      sourcePath: paths.publicDir
      destinationPath: paths.staticDir
