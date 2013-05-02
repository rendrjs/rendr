// We have to make sure some client-side dependencies
// actually exist in node_modules.

var spawn = require('child_process').spawn;

var dependencies = [
  'underscore',
  'backbone',
  'async',
  'handlebars'
];

var root = __dirname + '/..',
    pkg = require('../package.json'),
    version,
    pkgVersion,
    process;

dependencies.forEach(function(dep) {
  version = pkg.dependencies[dep];
  pkgVersion = dep + '@' + version;
  console.log('POSTINSTALL: npm install ' + pkgVersion);
  process = spawn('npm', ['install', pkgVersion], {cwd: root});
  process.stdout.on('data', function(data) {
    console.log(data.toString());
  });
});
