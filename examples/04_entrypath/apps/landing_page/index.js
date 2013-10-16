var express = require('express')
  , hbs = require('hbs').create()
  , app = express();

/**
 * Export the Express app so it can be used as a middleware by the top-level `index.js`.
 */
module.exports = app;

/**
 * Handle Handlebars templates using 'hbs' extension.
 */
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
app.set('view options', {
  layout: 'layout'
});
app.engine('hbs', hbs.__express);

app.get('/', function(req, res) {
  res.render('index');
});
