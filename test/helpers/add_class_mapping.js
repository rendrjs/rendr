var AddClassMapping, ModelUtils;

ModelUtils = require('../../shared/modelUtils');

module.exports = AddClassMapping = (function() {
  function AddClassMapping(utils) {
    this.utils = utils;
    this.utils || (this.utils = new ModelUtils);
  }

  AddClassMapping.prototype.add = function(key, modelConstructor) {
    return this.utils._classMap[this.utils.underscorize(key)] = modelConstructor;
  };

  return AddClassMapping;

})();
