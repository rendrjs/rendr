// We have to make sure some client-side dependencies
// actually exist in node_modules.

var npm = require("npm");


var root = __dirname + '/..',
  pkg = require('../package.json');

var dependencies = [
  'underscore@' + pkg.dependencies.underscore,
  'backbone@' + pkg.dependencies.backbone,
  'async@' + pkg.dependencies.async,
  'git://github.com/spikebrehm/handlebars.js.git#0687c7016c62122ab160a8683817a931b03354ad'];

npm.load({
  'cwd': root
}, function(er) {
  if (er) {
    handleError(er);
    return;
  } 
  npm.commands.install(dependencies, function(er, data) {
    if (er) {
      handleError(er);
      return;
    } 
    console.log(data);
  })
  npm.on("log", function(message) {
    console.log(message);
  })
});

function handleError(er) {
  console.error(er.stack || er.message);
}
