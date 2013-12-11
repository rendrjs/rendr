if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var _ = require('underscore');

  return {
    index: function(params, callback) {

      var spec = {
        collection: {collection: 'Users', params: params}
      };

      this.app.fetch(spec, function(err, result) {
        callback(err, result);
      });
    },

    show: function(params, callback) {

      var spec = {
        model: {model: 'User', params: params},
        repos: {collection: 'Repos', params: {user: params.login}}
      };

      // It's another workaround and will be integrated into Rendr on step 3 of my changes
      this.app.fetch(spec, function(err, result) {
        callback(err, result);
      });
    }
  };

});
