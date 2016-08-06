var Base = require('./base');

module.exports = Base.extend({
  url: '/repositories?owner.login=:owner&name=:name',
  idAttribute: 'name'
});
module.exports.id = 'Repo';
