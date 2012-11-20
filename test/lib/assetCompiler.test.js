var assetCompiler = require('../../server/lib/assetCompiler');
var fs = require('fs');
var path = require('path');
var expect = require('expect.js');
var should = require('should');


var testAssetConfig = {
  tempDir: path.normalize(__dirname + '/../testtmp'),
};

function clean(callback) {
  if (fs.existsSync(testAssetConfig.tempDir + '/templates.js')) {
    fs.unlink(testAssetConfig.tempDir + '/templates.js');
  }
  if (fs.existsSync(testAssetConfig.tempDir)) {
    fs.rmdirSync(testAssetConfig.tempDir);
  }
  return callback();
}


describe('assetCompiler', function() {

  // after(function(done){
  //   clean(done);
  // });

  /**
    Verify that init works and temp directory created
  */
  it('should init', function(done) {
    clean(function(err) {
      fs.existsSync(testAssetConfig.tempDir).should.be.false;
      assetCompiler.init(testAssetConfig, undefined, function(err, response) {
        if (err) throw err;
        response.should.equal("OK");
        done();
      });
    });
  });

  it('should compile', function(done) {
    assetCompiler.init(testAssetConfig, undefined, function(err) {
      if (err) throw err;

      assetCompiler.compile(function(err, results) {
        if (err) throw err;
        console.log(results);
        results.js.should.match(/\/public\/mergedAssets.js$/);
        fs.existsSync(results.js).should.be.true;
        results.css.should.match(/\/public\/styles.css$/);
        fs.existsSync(results.css).should.be.true;
        done();
      })
    });
  });

});
