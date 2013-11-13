if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{

  var _ = require('underscore');

  return {
    index: function(params, callback) {

      var _controller = this;

      var spec = {
        collection: {collection: 'Users', params: params}
      };

      // It's another workaround and will be integrated into Rendr on step 3 of my changes
      require([rendr.entryPath + 'app/views/users/index', rendr.entryPath + 'app/collections/users'], function(view)
      {
        _controller.app.fetch(spec, function(err, result) {
          callback(err, result);
        });
      });
    },

    show: function(params, callback) {

      var _controller = this;

      var spec = {
        model: {model: 'User', params: params},
        repos: {collection: 'Repos', params: {user: params.login}}
      };

      // It's another workaround and will be integrated into Rendr on step 3 of my changes
      require(
      [ rendr.entryPath + 'app/views/users/show'
      , rendr.entryPath + 'app/views/user_repos_view'
      , rendr.entryPath + 'app/collections/users'
      , rendr.entryPath + 'app/collections/repos'
      ], function(view)
      {
        _controller.app.fetch(spec, function(err, result) {
          callback(err, result);
        });
      });
    },

    // This is the same as `show`, but it doesn't fetch the Repos. Instead,
    // the `users_show_lazy_view` template specifies `lazy=true` on its
    // subview. We have both here for demonstration purposes.
    show_lazy: function(params, callback) {

      var _controller = this;

      var spec = {
        model: {model: 'User', params: params}
      };

      _controller.app.fetch(spec, function(err, result) {
        if (err) return callback(err);
        // Extend the hash of options we pass to the view's constructor
        // to include the `template_name` option, which will be used
        // to look up the template file. This is a convenience so we
        // don't have to create a separate view class.
        _.extend(result, {
          template_name: 'users/show_lazy'
        });

        // It's another workaround and will be integrated into Rendr on step 3 of my changes
        require([rendr.entryPath + 'app/views/users/show'], function(view)
        {
          callback(err, result);
        });
      });
    }
  };

});
