module.exports = function(grunt) {

  var browsers = [{
      browserName: 'firefox',
      version: '19',
      platform: 'XP'
    }, {
      browserName: 'chrome',
      platform: 'XP'
    }, {
      browserName: 'chrome',
      platform: 'linux'
    }, {
      browserName: 'internet explorer',
      platform: 'WIN8',
      version: '10'
    }, {
      browserName: 'internet explorer',
      platform: 'VISTA',
      version: '9'
    }, {
      browserName: 'internet explorer',
      platform: 'XP',
      version: '8'
    }, {
      browserName: 'opera',
      platform: 'Windows 2008',
      version: '12'
    }];


  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    connect: {
      server: {
        options: {
          base: 'test',
          port: 9999
        }
      }
    },

    mochaTest: {
      files: ['test/**/*.test.js']
    },

    mochaTestConfig: {
      options: {
        reporter: 'spec',
        ui: 'bdd'
      }
    },

    'saucelabs-qunit': {
      all: {
        username: 'rendrjs',
        key: 'ca5235b5-04b3-4da7-92e2-2d25677e474e',
        options: {
          urls: ['http://127.0.0.1:9999/qunit/index.html', 'http://127.0.0.1:9999/qunit/logs.html'],
          tunnelTimeout: 5,
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 3,
          browsers: browsers
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('sauce-test', ['connect', 'saucelabs-qunit']);
  grunt.registerTask('unit-test', ['mochaTest']);

  grunt.registerTask('test', ['unit-test', 'sauce-test']);

  grunt.registerTask('travis', ['test']);

  grunt.registerTask('default', ['test']);
};
