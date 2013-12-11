var path = require('path')
  , async = require('async')
  ;

var stylesheetsDir = 'assets/stylesheets';
var rendrDir = 'node_modules/rendr';
var rendrHandlebarsDir = 'node_modules/rendr-handlebars';
var rendrModulesDir = rendrDir + '/node_modules';

module.exports = function(grunt)
{
  // attach current grunt instance as first argument
  var executeFunc = executeFuncStub.bind(this, grunt);

  // workaround, while Jon is working on custom paths for the app
  grunt.registerTask('app_copy', function()
  {
    // it's async
    var done = grunt.task.current.async();

    async.series(
    [ executeFunc('mkdir', ['-p', 'public/js'])
    , executeFunc('cp', ['-rf', 'app', 'public/js'])
    ], done);
  });


  // {{{ workaround for requirejs issue
  // https://github.com/jrburke/requirejs/issues/942
  grunt.registerTask('rendr_copy', function()
  {
    // it's async
    var done = grunt.task.current.async();

    async.series(
    [ executeFunc('mkdir', ['-p', 'tmp/rendr'])
    , executeFunc('cp', ['-rf', 'node_modules/rendr/client', 'tmp/rendr'])
    , executeFunc('cp', ['-rf', 'node_modules/rendr/shared', 'tmp/rendr'])
    ], done);
  });

  grunt.registerTask('rendr_clean', function()
  {
    // it's async
    var done = grunt.task.current.async();

    async.series(
    [ executeFunc('rm', ['-rf', 'tmp/rendr'])
    ], done);
  });

  // }}}

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    stylus: {
      compile: {
        options: {
          paths: [stylesheetsDir],
          'include css': true
        },
        files: {
          'public/styles.css': stylesheetsDir + '/index.styl'
        }
      }
    },

    handlebars: {
      compile_server: {
        options: {
          namespace: false,
          commonjs: true,
          processName: function(filename) {
            return filename.replace('app/templates/', '').replace('.hbs', '');
          }
        },
        src: "app/templates/**/*.hbs",
        dest: "app/templates/compiledTemplates.js",
        filter: function(filepath) {
          var filename = path.basename(filepath);
          // Exclude files that begin with '__' from being sent to the client,
          // i.e. __layout.hbs.
          return filename.slice(0, 2) !== '__';
        }
      },
      compile_client: {
        options: {
          amd: true,
          processName: function(filename) {
            return filename.replace('app/templates/', '').replace('.hbs', '');
          }
        },
        src: "app/templates/**/*.hbs",
        dest: "public/js/app/templates/compiledTemplates.js",
        filter: function(filepath) {
          var filename = path.basename(filepath);
          // Exclude files that begin with '__' from being sent to the client,
          // i.e. __layout.hbs.
          return filename.slice(0, 2) !== '__';
        }
      }
    },

    watch: {
      scripts: {
        files: 'app/**/*.js',
        tasks: ['app_copy', 'handlebars:compile_client'],
        options: {
          interrupt: true
        }
      },
      templates: {
        files: 'app/**/*.hbs',
        tasks: ['handlebars'],
        options: {
          interrupt: true
        }
      },
      stylesheets: {
        files: [stylesheetsDir + '/**/*.styl', stylesheetsDir + '/**/*.css'],
        tasks: ['stylus'],
        options: {
          interrupt: true
        }
      }
    },

    rendr_requirejs:
    {
      init_libs:
      {
        options:
        {
          optimize: 'none',
          out: 'public/js/libs.js',
          baseUrl: 'public/js',
          create: true,
          name: 'libs',
          paths:
          {
            jquery: '../../assets/vendor/jquery-1.9.1.min',
            json: '../../assets/vendor/json2'
          },
          shim:
          {
            async:
            {
              exports: 'async'
            },
            jquery:
            {
              exports: 'jQuery'
            },
            underscore:
            {
              exports: '_'
            },
            backbone:
            {
              deps:
              [
                'jquery',
                'underscore'
              ],
              exports: 'Backbone'
            },
          },
          include:
          [
            'requirejs',
            'json',
            'jquery',
            'underscore',
            'backbone',
            'async',
            'handlebars'
          ],
          node_modules:
          [
            {name: 'requirejs', location: 'requirejs', main: 'require.js'},
            {name: 'underscore', location: 'rendr/node_modules/underscore', main: 'underscore.js'},
            {name: 'backbone', location: 'rendr/node_modules/backbone', main: 'backbone.js'},
            {name: 'handlebars', location: 'rendr-handlebars/node_modules/handlebars/dist', main: 'handlebars.runtime.js'},
            {name: 'async', location: 'rendr/node_modules/async/lib', main: 'async.js'}
          ]
        }
      },
      init_rendr_handlebars:
      {
        options:
        {
          optimize: 'none',
          out: 'public/js/rendr-handlebars.js',
          baseUrl: 'public/js',
          cjsTranslate: true,
          create: true,
          name: 'rendr-handlebars',
          rawText: {
              'rendr/shared/globals': 'define(["rendr/shared/globals"], function () {});'
          },
          include:
          [
            'rendr-handlebars'
          ],
          exclude:
          [
            'handlebars',
            'underscore'
          ],
          node_modules:
          [
            {name: 'rendr-handlebars', location: 'rendr-handlebars', main: 'index.js'},
            {name: 'handlebars', location: 'rendr-handlebars/node_modules/handlebars/dist', main: 'handlebars.runtime.js'},
            {name: 'underscore', location: 'rendr/node_modules/underscore', main: 'underscore.js'}
          ]
        }
      },
      init_client:
      {
        options:
        {
          optimize: 'none',
          appDir: 'tmp/rendr/client',
          dir: 'public/js/rendr/client',
          baseUrl: './rendr/client',
          cjsTranslate: true,
          paths:
          {
            'rendr/client': '../..',
            'rendr/shared': '../../../shared'
          },
          node_modules:
          [
            {name: 'underscore', location: 'rendr/node_modules/underscore', main: 'underscore.js'},
            {name: 'backbone', location: 'rendr/node_modules/backbone', main: 'backbone.js'},
            {name: 'async', location: 'rendr/node_modules/async/lib', main: 'async.js'}
          ],
          modules:
          [
            {name: 'rendr/client/app_view', exclude: ['underscore', 'backbone', 'async', 'rendr/shared/base/view']},
            {name: 'rendr/client/router', exclude: ['underscore', 'backbone', 'rendr/shared/base/router', 'rendr/shared/base/view', 'rendr/client/app_view']}
          ]
        }
      },
      init_shared:
      {
        options:
        {
          optimize: 'none',
          appDir: 'tmp/rendr/shared',
          dir: 'public/js/rendr/shared',
          baseUrl: './rendr/shared',
          cjsTranslate: true,
          insertRequire: ['rendr/shared/globals'],
          paths:
          {
            'rendr/shared': '../..',
            'globals': '../../globals'
          },
          rawText: {
              'app/router': 'define(["app/router"], function () {});'
          },
          node_modules:
          [
            {name: 'underscore', location: 'rendr/node_modules/underscore', main: 'underscore.js'},
            {name: 'backbone', location: 'rendr/node_modules/backbone', main: 'backbone.js'},
            {name: 'async', location: 'rendr/node_modules/async/lib', main: 'async.js'}
          ],
          modules: [
            { name: 'rendr/shared/app', exclude: ['backbone', 'rendr/shared/globals', 'rendr/shared/fetcher', 'app/router'] },
            { name: 'rendr/shared/fetcher', exclude: ['underscore', 'backbone', 'async', 'rendr/shared/modelUtils', 'rendr/shared/store/model_store', 'rendr/shared/store/collection_store'] },
            { name: 'rendr/shared/globals' },
            { name: 'rendr/shared/modelUtils', exclude: ['rendr/shared/base/model', 'rendr/shared/base/collection'] },
            { name: 'rendr/shared/syncer', exclude: ['underscore', 'backbone'] },
            { name: 'rendr/shared/base/collection', exclude: ['underscore', 'backbone', 'rendr/shared/syncer', 'rendr/shared/base/model'] },
            { name: 'rendr/shared/base/model', exclude: ['underscore', 'backbone', 'rendr/shared/syncer'] },
            { name: 'rendr/shared/base/router', exclude: ['underscore', 'backbone'] },
            { name: 'rendr/shared/base/view', exclude: ['underscore', 'backbone', 'async', 'rendr/shared/modelUtils', 'rendr/shared/base/model', 'rendr/shared/base/collection', 'rendr/shared/syncer'] },
            { name: 'rendr/shared/store/collection_store', exclude: ['underscore', 'rendr/shared/store/memory_store', 'rendr/shared/modelUtils', 'rendr/shared/base/collection', 'rendr/shared/base/model', 'rendr/shared/syncer', 'backbone'] },
            { name: 'rendr/shared/store/memory_store' },
            { name: 'rendr/shared/store/model_store', exclude: ['underscore', 'rendr/shared/store/memory_store', 'rendr/shared/modelUtils', 'rendr/shared/base/collection', 'rendr/shared/base/model', 'rendr/shared/syncer', 'backbone'] }
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-rendr-requirejs');

  // get init tasks together
  grunt.registerTask('init_rendr',
  [ 'rendr_requirejs:init_client'
  , 'rendr_requirejs:init_shared'
  ]);


  grunt.registerTask('init',
  [ 'app_copy'
  , 'rendr_clean'
  , 'rendr_copy'
  , 'rendr_requirejs:init_libs'
  , 'rendr_requirejs:init_rendr_handlebars'
  , 'init_rendr'
  , 'init_rendr' // needed two times as workaround for requirejs bug
  , 'rendr_clean'
  ]);



  grunt.registerTask('runNode', function () {
    grunt.util.spawn({
      cmd: 'node',
      args: ['./node_modules/nodemon/nodemon.js', 'index.js'],
      opts: {
        stdio: 'inherit'
      }
    }, function () {
      grunt.fail.fatal(new Error("nodemon quit"));
    });
  });

  grunt.registerTask('compile', ['handlebars', 'stylus']);

  // Run the server and watch for file changes
  grunt.registerTask('server', ['runNode', 'compile', 'watch']);

  // Default task(s).
  grunt.registerTask('default', ['compile']);
};

// --- Santa's little helpers

// wrapper for grunt.util.spawn
// to trim down boilerplate
// while using with async
// Note: Assumed grunt instance will be curried
function executeFuncStub(grunt, cmd, args)
{
  return function(callback)
  {
    grunt.util.spawn({
      cmd: cmd,
      args: args
    },
    function (err, res, code)
    {
      if (err || code) return callback(err || code, res);

      callback(null, res);
    });
  }
}
