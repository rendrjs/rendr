var Base = require('./base');

module.exports = Base.extend({
  url: '/users?login=:login',
  idAttribute: 'login'
});
module.exports.id = 'User';
