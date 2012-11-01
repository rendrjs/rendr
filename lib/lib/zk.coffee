##
# Zookeeper/Thrift interface for service discovery in the cloud
##
_ = require('underscore')
pool = require('./zkPool')
# this depends on a copy of thrift that exports protocol and transport inner classes
thrift = null #lazy load this library
zookeeper = null #lazy load this library

logger = null
serverPool = null
config = 
  maxConnectRetries: 5
  retryTimeout: 500
  timeout: 200000
  zkLoggerEnabled: false
  logPrefix: "ZooKeeper"

##
# options
# - enabled
# - maxConnectRetries
# - servers:['localhost:1234']
##
module.exports.init = (options, aLogger, callback) ->
  _.extend config, options if options
  logger = aLogger
  serverPool = pool.create(config.servers);
  config.enabled = false if pool.isEmpty(serverPool)
  if config.enabled
    zookeeper = require('zookeeper')
    thrift = require('thrift') 
  callback()

##
# enabled flag
##
isEnabled = module.exports.isEnabled = () ->
  (config && config.enabled)

##
# Connect to zk server
# Find next server in server pool and connect to it.  Retry upto maxConnectRetries.  
# Return error or server connection handle.
#
module.exports.connect = (callback) ->
  return callback('zookeeper disabled') if !isEnabled()
  attemptConnect(0, callback)

##
#  recursively attempt connect until maxConnectRetries reached
#
attemptConnect = (attempt, callback) ->
  if (attempt >= config.maxConnectRetries)
    return callback("ZooKeeper Connection failed:  #{config.maxConnectRetries} exceeded")

  conf = 
    timeout: config.timeout,
    debug_level: zookeeper.ZOO_LOG_LEVEL_ERROR,
    host_order_deterministic: false,
    connect: pool.next(serverPool)

  zook = new zookeeper(conf);
  zook.connect (err) ->
    if err
      setTimeout(attemptConnect(attempt+1, callback), config.retryTimeout)
    else
      return callback(null, zook);

##
# Get child nodes for a given path
#
module.exports.childNodes = (zkInstance, path, callback) ->
  zkInstance.a_get_children path, true, ( rc, err, children ) ->
    if (rc != 0)
      return callback("ERROR zk.a_get_children: #{rc}, error: '#{err}'")
    else if (children == null || children.length < 1) 
      return callback("ERROR zk.a_get_children: unexpected child state #{JSON.stringify(children)}")
    else
      return callback null, children

## 
# given path to specific zookeeper node, read data
module.exports.readNode = (zkInstance, path, callback) ->
  zkInstance.a_get path, true, (rc, err, stat, value) ->
    if (rc != 0) 
      return callback("#{config.logPrefix} read error for path #{path}: code=#{rc}, err='#{err}', stat=#{stat}")
    else if (value == null)
      return callback("#{config.logPrefix} read error for path #{path}: missing value")
    else
      return callback(null, value)

##
# Given a thrift-generated client class and serialized data, deserialize the data
#
# eg: thriftClientClass = require('../config/thrift/gen-nodejs/endpoint_types').ServiceInstance;
deserializeThrift = (thriftClientClass, thriftEncodedData, callback) ->
  try
    transport = new thrift.TFramedTransport(thriftEncodedData)
    protocol  = new thrift.TBinaryProtocol(transport)
    client = new thriftClientClass(protocol)
    return callback(null, client)
  catch e
    return callback(e);






