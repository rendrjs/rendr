var _ = require('underscore');

module.exports = {
  index: function(params, callback) {
    this.app.set('title', 'Users');

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
    this.app.fetch(spec, function(err, result) {
      // We must check for an error before accessing `result.model` (below),
      // which may be undefined if there's an error (404, 500, etc.).
      if (err) return callback(err);

      // Because the page title depends on the Repo model, we wait to set it
      // until the fetch is complete.
      this.app.set('title', 'User: ' + result.model.get('login'));

      callback(null, result);
    }.bind(this));
  },

  // This is the same as `show`, but it doesn't fetch the Repos. Instead,
  // the `users_show_lazy_view` template specifies `lazy=true` on its
  // subview. We have both here for demonstration purposes.
  show_lazy: function(params, callback) {
    var spec = {
      model: {model: 'User', params: params}
    };
    this.app.fetch(spec, function(err, result) {
      // We must check for an error before accessing `result.model` (below),
      // which may be undefined if there's an error (404, 500, etc.).
      if (err) return callback(err);

      // Because the page title depends on the Repo model, we wait to set it
      // until the fetch is complete.
      this.app.set('title', 'User: ' + result.model.get('login'));

      // Extend the hash of options we pass to the view's constructor
      // to include the `template_name` option, which will be used
      // to look up the template file. This is a convenience so we
      // don't have to create a separate view class.
      _.extend(result, {
        template_name: 'users/show_lazy'
      });
      callback(null, result);
    });
  }
};
