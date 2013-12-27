module.exports = function(grunt) {
  'use strict';

  var _ = require('underscore'),
      clientOptions, serverOptions, sharedOptions, testGlobals;

  clientOptions = {
    browser: true,
    jquery: true,
    node: false
  };

  serverOptions = {
    browser: false,
    jquery: false,
    node: true
  };

  sharedOptions = {
    browser: true,
    jquery: true,
    node: true
  };

  testGlobals = {
    expect: true,
    sinon: true,
    describe: true,
    it: true,
    after: true,
    afterEach: true,
    before: true,
    beforeEach: true
  };

  grunt.initConfig({
    jshint: {
      options: {
        bitwise: true,
        camelcase: true,
        curly: true,
        eqeqeq: true,
        indent: 2,
        newcap: true,
        plusplus: false,
        quotmark: 'single',
        undef: true,
        strict: true,
        maxlen: 80
      },

      client: {
        files: { src: [ 'client/**/*.js', 'test/client/**/*.js' ] },
      },

      clientTest: {
        options: _.extend({}, clientOptions, { globals: testGlobals }),
        files: { src: [ 'test/client/**/*.js' ] }
      },

      server: {
        options: serverOptions,
        files: { src: [ 'Gruntfile.js', 'index.js', 'server/**/*.js' ] },
      },

      serverTest: {
        options: _.extend({}, serverOptions, { globals: testGlobals }),
        files: { src: [ 'test/server/**/*.js' ] },
        globals: testGlobals
      },

      shared: {
        options: sharedOptions,
        files: { src: [ 'shared/**/*.js'] }
      },

      sharedTest: {
        options: _.extend({}, sharedOptions, { globals: testGlobals }),
        files: { src: [ 'test/shared/**.js' ] }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint']);
};
