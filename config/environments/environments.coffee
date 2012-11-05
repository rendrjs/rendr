#
# Global config settings, over-ridden by NODE_ENV settings
#
exports.rootDir = rootDir = __dirname + '/../..'
exports.publicDir = publicDir = rendr.entryPath + '/../public'

exports.config =
  api:
    host: 'https://api.localhost.airbnb.com:3001'
    key: '9f1axjd321k41kdo3114qx9ba'

  logger:
    logLevel:'info'
    stdioEnabled:true

  assetCompiler:
    enabled: false
    jsSrcPaths: [rootDir + '/tmp/assetCompiler', rendr.entryPath]
    stichedJsFile: publicDir + '/mergedAssets.js'
    minify: true

  assets:
    publicDir: publicDir
    cdn:
      protocol: 'http'
      cnames: ['0.0.0.0:3030']
      pathPrefix: '/'
    fingerprint:
      enabled: false
      sourcePath: publicDir
      destinationPath: rootDir + '/static'

  statsd:
    host: '127.0.0.1'
    port: 8125
