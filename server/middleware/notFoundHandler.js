/**
 * Handle a 404.
 */
module.exports = function notFoundHandler() {
  return function notFoundHandler(req, res, next) {
    res.status(404);

    // Respond with HTML
    if (req.accepts('html')) {
      res.send("<!doctype html>\
        <html>\
        <head>\
         <title>Page not found</title>\
        </head>\
        <body>\
          <h1>Page not found</h1>\
          <p>Could not find page at <pre>" + req.url + "</pre></p>\
          <small>Error 404</small>\
        </body>\
        </html>\
      ");

    // Respond with JSON
    } else if (req.accepts('json')) {
      res.json({error: 'Not found'});

    // Respond with plain-text.
    } else {
      res.type('txt').send('Not found');
    }
  };
};
