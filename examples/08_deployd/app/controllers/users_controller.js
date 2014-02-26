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
  }
};
