utils = require('../../shared/modelUtils')

/**
 * Use this to specify class constructors based on
 * model/collection name. Useful i.e. for testing.
 */
module.exports = function(key, modelConstructor) {
  utils._classMap[utils.underscorize(key)] = modelConstructor;
};
