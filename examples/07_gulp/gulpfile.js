var gulp = require('gulp');
var glob = require('glob');

var browserify = require('browserify');
var handlebars = require('gulp-handlebars');
var nodemon    = require('gulp-nodemon');
var stylus  = require('gulp-stylus');
var concat  = require('gulp-concat');
var wrap    = require('gulp-wrap');

var gutil  = require('gulp-util');
var source = require('vinyl-source-stream');

var stylesheetsDir = './assets/stylesheets';

// error handling
var handleError = function (err) {
    gutil.log(err.toString());
    this.emit('end');
};

var gulpPlumber = require('gulp-plumber');
var plumber = function () {
    return gulpPlumber({ errorHandler : handleError });
};

//------------------------------------------------
// HANDLEBARS
//------------------------------------------------
gulp.task('handlebars:compile', function () {

    return gulp.src('./app/templates/**/[!__]*.hbs')
        .pipe(plumber())
        .pipe(handlebars({ wrapped : true }))
        .pipe(wrap('templates["<%= file.relative.replace(/\\\\/g, "/").replace(/.js$/, "") %>"] = <%= file.contents %>;\n'))
        .pipe(concat('compiledTemplates.js'))
        .pipe(wrap('module.exports = function(Handlebars){\ntemplates = {};\n<%= contents %>\nreturn templates \n};'))
        .pipe(gulp.dest('app/templates/'));
});

gulp.task('handlebars:watch', function () {
    return gulp.watch('./app/templates/**/*.hbs', [ 'handlebars:compile' ]);
});

//------------------------------------------------
// STYLUS
//------------------------------------------------

gulp.task('stylus:compile', function () {

    var opts = { set : [ 'include css' ] };

    return gulp.src(stylesheetsDir + '/index.styl')
        .pipe(plumber())
        .pipe(stylus(opts))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest('./public'));
});

gulp.task('stylus:watch', function () {
    gulp.watch(stylesheetsDir + '/index.styl', [ 'stylus:compile' ]);
});

//------------------------------------------------
// BROWSERIFY
//------------------------------------------------

// get rendr shared & client files list
rendrClientFiles = glob.sync('rendr/{client,shared}/**/*.js', { cwd : './node_modules/' });

rendrModules = rendrClientFiles.map(function (file) {
    return file.replace('.js', '')
});

var getBundler = function (globs) {

    var bundler, files;

    bundler = browserify({
        fullPaths : false,
        entries   : []
    });

    globs.forEach(function (pattern) {
        files = glob.sync(pattern, { cwd : './' });
        files.forEach(function (file) {
            // it's nesessary for some app modules (e.g. 'app/app')
            // to be exposed otherwise rendr couldn't require them
            moduleName = file.replace(/.js$/, '')
            bundler.require('./' + file, { expose: moduleName});
        });
    });

    rendrModules.forEach(function (moduleName) {
        bundler.require(moduleName);
    });

    bundler.require('rendr-handlebars');
    bundler.require('./assets/vendor/jquery-1.9.1.min.js', { expose : 'jquery' });

    return bundler;
};

gulp.task('browserify:app', [ 'handlebars:compile' ], function () {

    var bundler = getBundler([ 'app/**/*.js' ]),
        options = { insertGlobals : false, debug : true };

    return bundler.bundle(options)
        .on('error', handleError)
        .pipe(plumber())
        .pipe(source('mergedAssets.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('browserify:test', function () {

    var bundler = getBundler([ 'test/app/**/*.js', 'app/**/*.js', 'test/helper.js' ]),
        options = { insertGlobals : false, debug : true };

    return bundler.bundle(options)
        .on('error', handleError)
        .pipe(plumber())
        .pipe(source('testBundle.js'))
        .pipe(gulp.dest('./public'));
});

gulp.task('browserify:watch', function () {
    gulp.watch('./app/**/*.js', [ 'browserify:app' ])
});

//------------------------------------------------
// RUN
//------------------------------------------------

gulp.task('runNode', function () {
    nodemon({
        script : 'index.js',
        ext    : 'js',
        ignore : [ 'public/', 'gulpfile.js' ]
    });
});


gulp.task('compile', [ 'handlebars:compile', 'browserify:app',   'browserify:test', 'stylus:compile' ]);
gulp.task('watch',   [ 'handlebars:watch',   'browserify:watch', 'stylus:watch' ]);
gulp.task('server',  [ 'compile', 'runNode', 'watch' ]);
gulp.task('default', [ 'compile' ]);