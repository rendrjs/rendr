require(
[ 'handlebars'
, 'app/routes'
, 'rendr/shared/globals'
, 'rendr-handlebars'
], function() {

  require(
  [ 'app/app'
  // it's a hack, will be made proper in the step 3 of the changes
  , 'app/templates/compiledTemplates'
  ], function(App) {


    // global reference
    var app = window.app = new App(appNS.appData);
    app.bootstrapData(appNS.bootstrappedData);
    app.start();
  });
});
