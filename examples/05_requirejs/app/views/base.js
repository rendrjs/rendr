if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(function(require) {

  var RendrView = require('rendr/shared/base/view');

  // Create a base view, for adding common extensions to our
  // application's views.
  return RendrView.extend({});

});
