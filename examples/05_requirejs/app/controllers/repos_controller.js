if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{

  return {
    index: function(params, callback) {

      var _controller = this;

      var spec = {
        collection: {collection: 'Repos', params: params}
      };

      // It's another workaround and will be integrated into Rendr on step 3 of my changes
      require([rendr.entryPath + 'app/views/repos/index', rendr.entryPath + 'app/collections/repos'], function(view)
      {
        _controller.app.fetch(spec, function(err, result) {
          callback(err, result);
        });

      });
    },

    show: function(params, callback) {

      var _controller = this;

      var spec = {
        model: {model: 'Repo', params: params, ensureKeys: ['language', 'watchers_count']},
        build: {model: 'Build', params: params}
      };

      // It's another workaround and will be integrated into Rendr on step 3 of my changes
      require(
      [ rendr.entryPath + 'app/views/repos/show'
      , rendr.entryPath + 'app/collections/repos'
      , rendr.entryPath + 'app/models/build'
      ], function(view)
      {
        _controller.app.fetch(spec, function(err, result) {
          callback(err, result);
        });

      });
    }
  };

});
