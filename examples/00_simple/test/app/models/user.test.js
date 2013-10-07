var should = require("should");
var User = require('../../../app/models/user');

describe('User', function() {

  it('should use login as the model id', function() {
    var user = new User({login: 'someusername'});
    user.id.should.equal('someusername');
  });

});
