var Server, should;

should = require('chai').should();
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


    it("should have a default templatePath", function() {
      server = new Server();
      server.options.templatePath.should.equal(server.options.entryPath + 'app/templates/')
    });

    it("should have an overridden templatePath", function() {
      server = new Server({templatePath: 'app/'});
      server.options.templatePath.should.equal(server.options.entryPath + 'app/')
    });



    it("should have a default compiledTemplatesFile", function() {
      server = new Server();
      server.options.compiledTemplatesFile.should.equal(server.options.entryPath + 'app/templates/compiledTemplates.js')
    });

    it("should have an overridden compiledTemplatesFile", function() {
      server = new Server({compiledTemplatesFile: 'test/'});
      server.options.compiledTemplatesFile.should.equal(server.options.entryPath + 'test/')
    });

  });

});
