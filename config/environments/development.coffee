# 
# Config settings for NODE_ENV=development
# Extends environments.js
#
e = require('./environments')
_ = require('underscore')

developmentConfig = 
  assetCompiler: 
    _.extend(e.config.assetCompiler, {enabled:true, minify:false})

exports.config = _.extend(e.config, developmentConfig)
