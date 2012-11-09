#
# Config settings for NODE_ENV=production
#
exports.rootDir = rootDir = __dirname + '/../..'
exports.publicDir = publicDir = rendr.entryPath + '/../public'

exports.config =
  api:
    host: 'https://api.airbnb.com'
    key: '9f1axjd321k41kdo3114qx9ba'

  assetCompiler:
    enabled: false
    jsSrcPaths: [rootDir + '/tmp/assetCompiler', rendr.entryPath]
    stichedJsFile: publicDir + '/mergedAssets.js'
    minify: true

  assets:
    publicDir: publicDir
    cdn:
      protocol: 'https'
      cnames: [0,1,2,3].map((i) -> return "a" + i + ".muscache.com")
      pathPrefix: '/airbnb/moweb'
    fingerprint:
      enabled: true,
      sourcePath: publicDir
      destinationPath: rendr.entryPath + '/../static'
