#
# Config settings for NODE_ENV=production
# Extends environments.js
#
e = require('./environments')
_ = require('underscore')

productionConfig =
  api:
    host: 'https://api.airbnb.com'
    key: '9f1axjd321k41kdo3114qx9ba'

  assets:
    publicDir: e.publicDir
    cdn:
      protocol: 'https'
      cnames: [0,1,2,3].map((i) -> return "a" + i + ".muscache.com")
      pathPrefix: '/airbnb/moweb'
    fingerprint:
      enabled: true,
      sourcePath: e.publicDir,
      destinationPath: e.rootDir + '/static'

exports.config = _.extend(e.config, productionConfig)
