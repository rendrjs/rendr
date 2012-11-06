// We have to make sure some client-side dependencies
// actually exist in node_modules.

var exec = require('child_process').exec;

// TODO: Don't duplicate; pull from assetCompiler.
var dependencies = [
  'underscore',
  'backbone',
  'async',
  'node-polyglot',
  'handlebars'
];

var root = __dirname + '/..';

exec('cd ' + root + '; npm install');
