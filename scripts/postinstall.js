// We have to make sure some client-side dependencies
// actually exist in node_modules.

var _ = require('underscore'),
    exec = require('child_process').exec;

// TODO: Don't duplicate; pull from assetCompiler.
var dependencies = [
  'underscore',
  'backbone',
  'async',
  'node-polyglot'
];

var root = __dirname + '/..';

_.each(dependencies, function(dep) {
  exec('cd ' + root + '; npm link ' + dep);
  console.log('POSTINSTALL: Linking dependency "'+dep+'".');
});
