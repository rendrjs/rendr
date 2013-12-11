if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  /**
   * We inject the Handlebars instance, because this module doesn't know where
   * the actual Handlebars instance will come from.
   */
  return function(Handlebars) {
    return {
      copyright: function(year) {
        return new Handlebars.SafeString("&copy;" + year);
      }
    };
  };

});
