var ModelUtils = require('../../shared/modelUtils');

module.exports = AddClassMapping;

function AddClassMapping(utils) {
  this.utils = utils || new ModelUtils();
}

AddClassMapping.prototype.add = function(key, modelConstructor) {
  return this.utils._classMap[this.utils.underscorize(key)] = modelConstructor;
};
