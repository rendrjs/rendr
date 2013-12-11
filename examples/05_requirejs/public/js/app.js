require(
[ 'handlebars'
, 'app/routes'
, 'rendr/shared/globals'
, 'rendr-handlebars'
], function() {

  require(
  [ 'app/app'
  , 'app/templates/compiledTemplates'
  ], function(App) {

    // global reference
    var app = window.app = new App(appNS.appData);
    app.bootstrapData(appNS.bootstrappedData);
    app.start();
  });
});
