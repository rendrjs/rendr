MemoryStore = require('./memory_store')
LocalStorageStore = require('./local_storage_store')

# TODO: be less magical. Use composition instead of inheritance.
BaseClass = if global.isServer
  MemoryStore
else
  LocalStorageStore

module.exports = class ResponseStore extends BaseClass
