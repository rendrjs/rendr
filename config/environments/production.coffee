#
# Config settings for NODE_ENV=production
#
paths = require('./paths')

exports.config =

  assetCompiler:
    enabled: false
    jsSrcPaths: [paths.rootDir + '/tmp/assetCompiler', paths.entryPath]
    stichedJsFile: paths.publicDir + '/mergedAssets.js'
    minify: true

  assets:
    publicDir: paths.publicDir
    cdn:
      protocol: 'https'
      cnames: [0,1,2,3].map((i) -> return "a" + i + ".muscache.com")
      pathPrefix: '/airbnb/moweb'
    fingerprint:
      enabled: true,
      sourcePath: paths.publicDir
      destinationPath: paths.staticDir
