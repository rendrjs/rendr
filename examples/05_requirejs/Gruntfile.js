var path = require('path')
  , async = require('async')
  , stylesheetsDir = 'assets/stylesheets'
  , rendrDir = 'node_modules/rendr'
  , rendrHandlebarsDir = 'node_modules/rendr-handlebars'
  , rendrModulesDir = rendrDir + '/node_modules'
;

module.exports = function(grunt) {

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
        tasks: ['rendr_requirejs:build_app', 'handlebars:compile_client'],
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

    rendr_requirejs: {
      build_common: {
        options: {
          optimize: 'none',
          out: 'public/js/common.js',
          baseUrl: 'public/js',
          create: true,
          name: 'common',
          paths: {
            jquery: '../../assets/vendor/jquery-1.9.1.min',
          },
          shim: {
            async: {
              exports: 'async'
            },
            jquery: {
              exports: 'jQuery'
            },
            underscore: {
              exports: '_'
            },
            backbone: {
              deps: [
                'jquery',
                'underscore'
              ],
              exports: 'Backbone'
            },
          },
          include: [
            'requirejs',
            'jquery',
            'underscore',
            'backbone',
            'async',
            'handlebars'
          ],
          node_modules: [
            // underscore, backbone and async may be located under rendr module or as peers to rendr.
            // grunt-rendr-requirejs will automatically check rendr dependencies and parent folders
            {name: 'requirejs', location: 'requirejs', main: 'require.js'},
            {name: 'underscore', location: 'underscore', main: 'underscore.js'},
            {name: 'backbone', location: 'backbone', main: 'backbone.js'},
            {name: 'handlebars', location: 'rendr-handlebars/node_modules/handlebars/dist', main: 'handlebars.runtime.js'},
            {name: 'async', location: 'async/lib', main: 'async.js'}
          ]
        }
      },
      build_rendr_handlebars: {
        options: {
          optimize: 'none',
          out: 'public/js/rendr-handlebars.js',
          baseUrl: 'public/js',
          cjsTranslate: true,
          create: true,
          name: 'rendr-handlebars',
          include: [
            'rendr-handlebars'
          ],
          exclude: [
            'handlebars',
            'underscore'
          ],
          node_modules: [
            {name: 'rendr-handlebars', location: 'rendr-handlebars', main: 'index.js'},
            {name: 'handlebars', location: 'rendr-handlebars/node_modules/handlebars/dist', main: 'handlebars.runtime.js'},
            {name: 'underscore', location: 'underscore', main: 'underscore.js'}
          ]
        }
      },

      build_rendr:
      {
        options:
        {
          optimize: 'none',
          dir: 'public/js',
          baseUrl: 'assets/js',
          cjsTranslate: true,
          keepBuildDir: true,
          paths:
          {
            'jquery': 'empty:',
            'underscore': 'empty:',
            'backbone': 'empty:',
            'async': 'empty:',
            'app/router': 'empty:',

            'rendr/client': '../../node_modules/rendr/client',
            'rendr/shared': '../../node_modules/rendr/shared',
          },
          modules:
          [
            {name: 'rendr/client/app_view', exclude: ['underscore', 'backbone', 'async', 'jquery', 'rendr/shared/base/view']},
            {name: 'rendr/client/router', exclude: ['underscore', 'backbone', 'jquery', 'rendr/shared/base/router', 'rendr/shared/base/view', 'rendr/client/app_view']},

            { name: 'rendr/shared/app', exclude: ['backbone', 'jquery', 'rendr/shared/fetcher', 'app/router', 'rendr/client/app_view', 'rendr/shared/syncer', 'rendr/shared/base/model', 'rendr/shared/base/collection', 'rendr/shared/modelUtils', 'rendr/shared/base/view'] },
            { name: 'rendr/shared/fetcher', exclude: ['underscore', 'jquery', 'backbone', 'async', 'rendr/shared/modelUtils', 'rendr/shared/store/model_store', 'rendr/shared/store/collection_store'] },
            { name: 'rendr/shared/modelUtils', exclude: ['rendr/shared/base/model', 'rendr/shared/base/collection'] },
            { name: 'rendr/shared/syncer', exclude: ['underscore', 'backbone', 'jquery'] },
            { name: 'rendr/shared/base/collection', exclude: ['underscore', 'backbone', 'jquery', 'rendr/shared/syncer', 'rendr/shared/base/model'] },
            { name: 'rendr/shared/base/model', exclude: ['underscore', 'backbone', 'jquery', 'rendr/shared/syncer'] },
            { name: 'rendr/shared/base/router', exclude: ['underscore', 'backbone', 'jquery'] },
            { name: 'rendr/shared/base/view', exclude: ['underscore', 'backbone', 'jquery', 'async', 'rendr/shared/modelUtils', 'rendr/shared/base/model', 'rendr/shared/base/collection', 'rendr/shared/syncer'] },
            { name: 'rendr/shared/store/collection_store', exclude: ['underscore', 'rendr/shared/store/memory_store', 'rendr/shared/modelUtils', 'rendr/shared/base/collection', 'rendr/shared/base/model', 'rendr/shared/syncer', 'backbone'] },
            { name: 'rendr/shared/store/memory_store' },
            { name: 'rendr/shared/store/model_store', exclude: ['underscore', 'rendr/shared/store/memory_store', 'rendr/shared/modelUtils', 'rendr/shared/base/collection', 'rendr/shared/base/model', 'rendr/shared/syncer', 'backbone'] }
          ]
        }
      },

      build_app:
      {
        options:
        {
          optimize: 'none',
          dir: 'public/js/app',
          baseUrl: 'app',
          cjsTranslate: true,
        }
      }

    }
  });


  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-rendr-requirejs');


  grunt.registerTask('build_world',
  [ 'rendr_requirejs:build_common'
  , 'rendr_requirejs:build_rendr_handlebars'
  , 'rendr_requirejs:build_rendr'
  , 'rendr_requirejs:build_app'
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
  grunt.registerTask('server', ['build_world', 'compile', 'runNode', 'watch']);

  // Default task(s).
  grunt.registerTask('default', ['compile']);

  // wrapper for grunt.util.spawn
  // to trim down boilerplate
  // while using with async
  function spawn(cmd, args) {
    return function(callback) {
      grunt.util.spawn({
        cmd: cmd,
        args: args
      }, function(err, res, code) {
        callback(err || code, res);
      });
    }
  }
};
