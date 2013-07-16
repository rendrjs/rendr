/**
 * Default error handler.
 */
module.exports = function errorHandler(options) {
  options = options || {};

  return function errorHandler(err, req, res, next) {
    var text;

    if (options.dumpExceptions) {
      text = "Error: " + err.message + "\n";
      if (err.stack) {
        text += "\nStack:\n " + err.stack;
      }
    } else {
      text = "500 Internal Server Error";
    }

    res.status(err.status || 500);
    res.type('text').send(text);
  };
};
