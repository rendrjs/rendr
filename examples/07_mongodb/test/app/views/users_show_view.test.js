require('chai');
var UsersShowView = require('../../../app/views/users/show')
  , App = require('../../../app/app')
;

describe('UsersShowView', function() {

  beforeEach(function() {
    this.app = new App({rootPath: '/'});
  });

  it('should have repos data in getTemplateData', function() {
    var repos = [{foo: 'bar'}];
    var view = new UsersShowView({ repos: repos, app: this.app });
    var data = view.getTemplateData();
    data.should.have.property('repos', repos);
  });

});
