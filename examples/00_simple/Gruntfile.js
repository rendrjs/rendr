var path = require('path');

var stylesheetsDir = 'assets/stylesheets';

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
        tasks: ['browserify'],
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

    browserify: {
      options: {
        debug: true,
        alias: [
          'node_modules/rendr-handlebars/index.js:rendr-handlebars'
        ],
        aliasMappings: [
          {
            cwd: 'app/',
            src: ['**/*.js'],
            dest: 'app/'
          }
        ],
        shim: {
          jquery: {
            path: 'assets/vendor/jquery-1.9.1.min.js',
            exports: '$'
          }
        }
      },
      app: {
        src: [ 'app/**/*.js' ],
        dest: 'public/mergedAssets.js'
      },
      tests: {
        src: [
          'test/helper.js',
          'test/app/**/*.js'
        ],
        dest: 'public/testBundle.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
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


  grunt.registerTask('compile', ['handlebars', 'browserify', 'stylus']);

  // Run the server and watch for file changes
  grunt.registerTask('server', ['compile', 'runNode', 'watch']);

  // Default task(s).
  grunt.registerTask('default', ['compile']);

};

