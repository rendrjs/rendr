'use strict';

module.exports = function (config) {
  config.set({
    files: [
      './stitched.js',
      './app/**/*.js'
    ],
    frameworks: [ 'mocha' ],
    browsers: [ 'Chrome' ]
  });
};
