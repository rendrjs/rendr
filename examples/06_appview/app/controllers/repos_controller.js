module.exports = {
  index: function(params, callback) {
    this.app.set('title', 'Repos');

    var spec = {
      collection: {collection: 'Repos', params: params}
    };
    this.app.fetch(spec, function(err, result) {
      callback(err, result);
    });
  },

  show: function(params, callback) {
    var spec = {
      model: {model: 'Repo', params: params, ensureKeys: ['language', 'watchers_count']},
      build: {model: 'Build', params: params}
    };
    this.app.fetch(spec, function(err, result) {
      // We must check for an error before accessing `result.model` (below),
      // which may be undefined if there's an error (404, 500, etc.).
      if (err) return callback(err);

      // Because the page title depends on the Repo model, we wait to set it
      // until the fetch is complete.
      this.app.set('title', 'Repo: ' + result.model.get('full_name'));

      callback(null, result);
    }.bind(this));
  }
};
