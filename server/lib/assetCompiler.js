/*jshint strict: false */
/*global require, module, rendr, __dirname */

/**
  Compile and combine handlebar templates into one js file.  Then stitch all javascript files
  (including templates) into one js file
*/
var _ = require('underscore');
var path = require('path');
var stitch  = require('stitch');
var fs      = require('fs');
var stylus = require('stylus');
var mkdirp = require('mkdirp');
var async = require('async');
var walk = require('walk');
var stylusHelpers = require('./stylusHelpers');
var jsPackage;
var exec = require('child_process').exec;

// THESE VALUES SHOULD NOT BE IN THE LIB -- PASS IN VIA CONFIG!
var paths = require('../../config/environments/env').paths;
var baseDir = paths.entryPath; //rendr.entryPath;
var rootDir = paths.rootDir;//path.normalize(__dirname + '/../..');
var publicDir = paths.publicDir;//baseDir + '/../public';
var assetsDir = paths.assetsDir;//baseDir + '/../assets';

var config = {
  stitchedJsFile: publicDir + '/mergedAssets.js',
  stylusEntryFile: assetsDir + '/stylesheets/index.styl',
  cssOutputFile: publicDir + '/styles.css',
  fingerprintedImagesDir: publicDir + '/fingerprinted',
  tempDir: rootDir + '/tmp',
  hbsTemplateSrcPath: paths.templatesDir,
  minify: true
};


/**
  Init and start the template and js compiler.
  options:
  - jsSrcPaths: directory where javascript files are found
  - stitchedJsFile: path and filename of where compiled/combined javascript file will be stored
  - minify: true/false if templates.js should be minified
*/
module.exports.init = function(options, logger, callback) {
  if (options) _.extend(config, options);

  // normalize paths
  var toNormalize = ['stitchedJsFile', 'stylusEntryFile', 'cssOutputFile', 'fingerprintedImagesDir', 'tempDir'];
  for (var i in toNormalize) {
    var key = toNormalize[i];
    config[key] = path.normalize(config[key]);
  }

  // create tmp dir
  if (!fs.existsSync(config.tempDir)) {
    fs.mkdirSync(config.tempDir);
  }
  // this is where the merged template file will live
  // notify stitch to look in tempDir for the js file we will place there
  if (!config.jsSrcPaths) config.jsSrcPaths = [];

  // Before we can create the Stitch package, let's grab the filenames
  // of all non-CommonJS dependencies.
  var walker = walk.walk(assetsDir + '/vendor'),
      vendorFiles = [],
      dependencies,
      i,
      filename;

  // Files in rendr.
  dependencies = [
    'assets/vendor/jquery-1.8.2.min.js',
    'assets/vendor/handlebars-runtime-1.0.rc.1.js',
    'node_modules/underscore/underscore.js',
    'node_modules/backbone/backbone.js',
    'node_modules/async/lib/async.js',
    'node_modules/node-polyglot/lib/polyglot.js'
  ];

  // Grab any files in application's 'assets/vendor' dir.
  walker.on('names', function(root, files){
    for (i in files) {
      filename = root + '/' + files[i];
      // Ignore dirs.
      if (filename.slice(filename.length - 3) === '.js') {
        vendorFiles.push(filename);
      }
    }
  });

  // Full path.
  for (i in dependencies) {
    dependencies[i] = rootDir + '/' + dependencies[i];
  }

  walker.on('end', function(){
    // Sort so we always get the same fingerprint on different systems.
    vendorFiles = vendorFiles.sort();

    // init Stitch
    jsPackage = stitch.createPackage({
      paths: config.jsSrcPaths,
      dependencies: dependencies.concat(vendorFiles)
    });
    callback(undefined, "OK");
  });
};

function compileStylus(stylusPath, callback) {
  fs.readFile(stylusPath, function(err, stylusFile) {
    stylus(stylusFile.toString())
      .include(assetsDir + '/stylesheets')
      .set('filename', config.cssOutputFile)
      .set('compress', config.minify)
      .define('asset-url', stylusHelpers.assetUrl())
      .define('image-url', stylusHelpers.assetUrl('images'))
      .render(function(err, css) {
        if (err) return callback(err);
        callback(null, css);
      });
  });
}


var compiledTemplatePrefix = [];
// compiledTemplatePrefix.push("Handlebars = this.window ? window.Handlebars : require('handlebars');");
compiledTemplatePrefix.push("module.exports = Handlebars.templates = {};");
compiledTemplatePrefix.push("\n");

function compileHbs(options, callback) {
  var srcPath = config.hbsTemplateSrcPath;
  var destFile = config.hbsTemplateSrcPath + "/compiledTemplates.js";

  // compile handlebar templates
  // reference handlebars locally vs globally
  var handlebarsCmd = rootDir + '/node_modules/.bin/handlebars';
  exec(handlebarsCmd + ' ' + srcPath + '/*.hbs', function(err, stdout, stderr) {
    if (err) return callback(err);
    // write compiled templates to file
    var data = compiledTemplatePrefix.join("\n") + stdout;
    fs.writeFile(destFile, data, 'utf8', function(err) {
      if (err) return callback(err);
      console.log(destFile + ' created');
      callback();
    });
  });
}

/**
  Compile templates into one js file, then stitch all js into one js file
*/
module.exports.compile = function(callback) {
  async.series([
    function(next){
      compileHbs(undefined, next);
    },
    function(next){
      mkdirp.sync(config.tempDir + '/assetCompiler/rendr');
      exec('cp -R '+rootDir+'/client '+rootDir+'/tmp/assetCompiler/rendr/; cp -R '+rootDir+'/shared '+rootDir+'/tmp/assetCompiler/rendr/', next);
    },
    function(next){
      jsPackage.compile(function (err, source) {
        if (err) return next(err);
        fs.writeFile(config.stitchedJsFile, source, function (err) {
          if (err) return next(err);
          console.log('Compiled ' + config.stitchedJsFile);
          next(null, {js: config.stitchedJsFile});
        });
      });
    },
    function(next){
      compileStylus(config.stylusEntryFile, function(err, css){
        if (err) return next(err);
        fs.writeFile(config.cssOutputFile, css, function (err) {
          if (err) return next(err);
          console.log('Compiled ' + config.cssOutputFile);
          next(null, {css: config.cssOutputFile});
        });
      });
    }
  ], function(err, results){
    if (err) return callback(err);
    var hash = {};
    results.forEach(function(result){
      _.extend(hash, result);
    });
    callback(null, hash);
  });
};
