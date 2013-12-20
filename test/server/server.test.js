var should = require('chai').should(),
    Server = require('../../server/server');

describe("server/server", function() {

  describe('express render Engine', function(){
    it("should have a default", function() {
      server = new Server();
      server.expressApp.get('view engine').should.equal('js')
    });
    it("should be able to be changed", function() {
      server = new Server({defaultEngine: 'other render engine'});
      server.expressApp.get('view engine').should.equal('other render engine')
    });
  });

});
