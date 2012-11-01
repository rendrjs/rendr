#
# Global config settings, over-ridden by NODE_ENV settings
#
exports.rootDir = rootDir = __dirname + '/../..'
exports.publicDir = publicDir = rendr.entryPath + '/public'

exports.config =
  api:
    host: 'https://api.localhost.airbnb.com:3001'
    key: '9f1axjd321k41kdo3114qx9ba'

  logger:
    logLevel:'info'
    stdioEnabled:true

  assetCompiler:
    enabled: false
    jsSrcPaths: [rendr.entryPath + '/app', rendr.entryPath + '/client']
    stichedJsFile: publicDir + '/mergedAssets.js'
    minify: true

  zookeeper:
    enabled: false
    loggerEnabled: true
    config:
      connect: "localhost:2181"
      timeout: 200000
      debug_level: require(rootDir + '/lib/server/lib/zk').ZOO_LOG_LEVEL_INFO
      host_order_deterministic: false

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
