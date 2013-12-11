if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {
  return {
    index: function(params, callback) {
      callback();
    }
  };

});
