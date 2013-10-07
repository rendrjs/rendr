/**
 * This is a very basic example middleware. It simply adds a property `locale`
 * to the request object based on the query string.
 */

module.exports = function addLocaleToRequest() {
  return function addLocaleToRequest(req, res, next) {
    req.locale = req.query.locale || 'en';
    next();
  };
};
