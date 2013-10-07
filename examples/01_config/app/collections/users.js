var User = require('../models/user')
  , Base = require('./base');

module.exports = Base.extend({
  model: User,
  url: '/users'
});
module.exports.id = 'Users';
