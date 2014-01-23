'use strict';

module.exports = function (config) {
  config.set({
    files: [
      '../public/testBundle.js'
    ],
    frameworks: [ 'mocha', 'browserify' ],
    browsers: [ 'Chrome' ],
    browserify: {
      watch: false
    }
  });
};
