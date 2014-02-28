var should = require('chai').should(),
  DataAdapter = require('../../../server/data_adapter');

describe('DataAdapter', function() {
  it('should initialize options', function () {
    var dataAdapter = new DataAdapter();
    dataAdapter.options.should.deep.equal({});
  });

  it('should throw an exception if the abstract request method is called', function () {
    var dataAdapter = new DataAdapter();
    dataAdapter.request.should.throw(Error, 'Implement me!')
  });
});
