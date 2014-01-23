'use strict';

module.exports = function (config) {
  config.set({
    files: [
      './stitched.js',
      './app/**/*.js'
    ],
    frameworks: [ 'mocha', 'browserify' ],
    browsers: [ 'Chrome' ],
    browserify: {
      watch: false
    }
  });
};
