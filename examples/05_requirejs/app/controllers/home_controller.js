if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{
  return {
    index: function(params, callback) {

      // It's another workaround and will be integrated into Rendr on step 3 of my changes
      require([rendr.entryPath + 'app/views/home/index'], function(view)
      {
        callback();
      });
    }
  };

});
