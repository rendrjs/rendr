var should = require('chai').should(),
  utils = require('../../server/utils');

describe('server/utils', function() {

  describe('isErrorStatus', function () {
    it('should return true for status codes between 400 and 600', function () {
      utils.isErrorStatus(399).should.be.false;
      utils.isErrorStatus(400).should.be.true;
      utils.isErrorStatus(599).should.be.true;
      utils.isErrorStatus(600).should.be.false;
    })

    it('should allow 4xx status codes if configured', function () {
      utils.isErrorStatus(400, {allow4xx: true}).should.be.false;
      utils.isErrorStatus(500, {allow4xx: true}).should.be.true;
    })
  });

});
