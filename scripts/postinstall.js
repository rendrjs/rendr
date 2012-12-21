// We have to make sure some client-side dependencies
// actually exist in node_modules.

var _ = require('underscore'),
    exec = require('child_process').exec;

// TODO: Don't duplicate; pull from assetCompiler.
var dependencies = [
  'underscore',
  'backbone',
  'async',
  'handlebars'
];

var root = __dirname + '/..',
    cmd;

_.each(dependencies, function(dep) {
  cmd = 'npm install ' + dep;
  console.log('POSTINSTALL: ' + cmd);
  exec('cd ' + root + '; ' + cmd);
});
