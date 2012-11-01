# 
# Config settings for NODE_ENV=development
# Extends environments.js
#
environments = require('./environments');
_ = require('underscore')

testConfig = 
  logger:
    logLevel:'debug'
    stdioEnabled:true

exports.config = _.extend(environments.config, testConfig)
