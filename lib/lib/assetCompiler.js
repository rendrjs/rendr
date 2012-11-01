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
var handlebars = require('handlebars');

var baseDir = rendr.entryPath;

var config = {
  stitchedJsFile: baseDir + '/public/mergedAssets.js',
  scssEntryFile: baseDir + '/assets/stylesheets/index.styl',
  cssOutputFile: baseDir + '/public/styles.css',
  fingerprintedImagesDir: baseDir + '/public/fingerprinted',
  tempDir: __dirname + '/../tmp',
  hbsTemplateSrcPath: baseDir + '/app/templates',
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
  var toNormalize = ['stitchedJsFile', 'scssEntryFile', 'cssOutputFile', 'fingerprintedImagesDir', 'tempDir'];
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
  var walker = walk.walk(baseDir + '/assets/vendor')
    , vendorFiles = []
    , dependencies
    , i
    , filename
    ;

  // If certain ones need to go first, list them.
  dependencies = [
    'jquery-1.6.2.min.js',
    'underscore-1.4.2.js'
  ];

  walker.on('names', function(root, files){
    for (i in files) {
      filename = root + '/' + files[i];
      // Ignore explicitly-ordered deps.
      if (dependencies.indexOf(files[i]) === -1) {
        // Ignore dirs.
        if (filename.slice(filename.length - 3) === '.js') {
          vendorFiles.push(filename);
        }
      }
    }
  });

  // Full path.
  for (i in dependencies) {
    dependencies[i] = baseDir + '/assets/vendor/' + dependencies[i];
  }

  walker.on('end', function(){
    // Sort so we always get the same fingerprint on different systems.
    vendorFiles = vendorFiles.sort();

    // init Stitch
    jsPackage = stitch.createPackage({
      paths: config.jsSrcPaths,
      dependencies: dependencies.concat(vendorFiles)
    });
    callback(undefined, "OK")
  });
}

function compileScss(scssPath, callback) {
  fs.readFile(scssPath, function(err, scssFile) {
    stylus(scssFile.toString())
      .include(baseDir + '/assets/stylesheets')
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
  var exec = require('child_process').exec;
  // reference handlebars locally vs globally
  var handlebarsCmd = __dirname + '/../../node_modules/.bin/handlebars'
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
      compileScss(config.scssEntryFile, function(err, css){
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
}

/**
  return path to compiled/combined javascript file
*/
module.exports.stitchedJsFile = function stitchedJsFile() {
  return config.stitchedJsFile;
}
