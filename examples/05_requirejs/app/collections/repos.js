if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var Repo = require('../models/repo')
    , Base = require('./base');

  var exports = Base.extend({
    model: Repo,
    url: function() {
      if (this.params.user != null) {
        return '/users/:user/repos';
      } else {
        return '/repositories';
      }
    }
  });
  exports.id = 'Repos';

  return exports;

});
