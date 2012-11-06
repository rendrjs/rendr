# Stub out default implementation to throw error.
# To be overridden by application.
exports.makeRequest = (req, callback) ->
  callback(new Error('dataAdapter: Implement me!'))
