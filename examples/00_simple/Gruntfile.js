var path = require('path');

var stylesheetsDir = 'assets/stylesheets';
var rendrDir = 'node_modules/rendr';
var rendrHandlebarsDir = 'node_modules/rendr-handlebars';
var rendrModulesDir = rendrDir + '/node_modules';

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
      compile: {
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
      }
    },

    watch: {
      scripts: {
        files: 'app/**/*.js',
        tasks: ['rendr_stitch'],
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

    copy: {
      jquery: {
        src: 'assets/vendor/jquery-1.9.1.min.js',
        dest: 'public/jquery-1.9.1.min.js'
      },
      json2: {
        src: 'assets/vendor/json2.js',
        dest: 'public/json2.js'
      }
    },

    browserify: {
      basic: {
        src: [
            'app/router.js',
            'app/routes.js',
            rendrDir + '/client/**/*.js',
            rendrDir + '/shared/**/*.js',
            rendrHandlebarsDir + '/index.js',
            rendrHandlebarsDir + '/shared/*.js',
            'app/**/*.js'
        ], 
        dest: 'public/mergedAssets.js', 
        options: {
          debug: true,
          transform: ['hbsfy'],
          ignore: [
            'node_modules/rendr/index.js'
          ],
          noParse: [
            'assets/vendor/**/*.js'
          ],
          require: true,
          alias: [
            'app/app.js:app/app',
            'app/router.js:/app/router',
            'app/routes.js:/app/routes',
            rendrHandlebarsDir + '/index.js:rendr-handlebars',
            'node_modules/rendr/node_modules/backbone/backbone.js:backbone'
          ],
          aliasMappings: [
            {
              cwd: 'app/',
              src: ['**/*.js'],
              dest: '/app/'
            },
            {
              cwd: 'node_modules/rendr/client',
              src: ['node_modules/rendr/client/**/*.js'],
              dest: 'rendr/client'
            }, 
            {
              cwd: rendrDir + '/shared',
              src: [rendrDir + '/shared/**/*.js'],
              dest: 'rendr/shared'
            }
          ]
        }
      }
    },

    rendr_stitch: {
      compile: {
        options: {
          dependencies: [
            'assets/vendor/**/*.js'
          ],
          npmDependencies: {
            underscore: '../rendr/node_modules/underscore/underscore.js',
            backbone: '../rendr/node_modules/backbone/backbone.js',
            handlebars: '../rendr-handlebars/node_modules/handlebars/dist/handlebars.runtime.js',
            async: '../rendr/node_modules/async/lib/async.js'
          }, aliases: [
            {from: rendrDir + '/client', to: 'rendr/client'},
            {from: rendrDir + '/shared', to: 'rendr/shared'},
            {from: rendrHandlebarsDir, to: 'rendr-handlebars'},
            {from: rendrHandlebarsDir + '/shared', to: 'rendr-handlebars/shared'}
          ]
        },
        files: [{
          dest: 'public/mergedAssets.js',
          src: [
            'app/**/*.js',
            rendrDir + '/client/**/*.js',
            rendrDir + '/shared/**/*.js',
            rendrHandlebarsDir + '/index.js',
            rendrHandlebarsDir + '/shared/*.js'
          ]
        }]
      },
      tests: {
        options: {
          dependencies: [ 'public/mergedAssets.js' ],
          npmDependencies: {
            chai: 'chai.js',
          },
        },
        files: [{
          dest: 'test/stitched.js',
          src: []
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-watch');

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


  grunt.registerTask('compile', ['copy', 'handlebars', 'browserify', 'stylus']);

  // Run the server and watch for file changes
  grunt.registerTask('server', ['runNode', 'compile', 'watch']);

  // Default task(s).
  grunt.registerTask('default', ['compile']);

  grunt.registerTask('aa', ['browserify']);
};
