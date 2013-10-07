/**
  * This middleware demonstrates updating session data. Increment a counter
  * for every page hit. Test it out by executing `App.get('session')` in
  * the console of the web browser.
  */

module.exports = function incrementCounter() {
  return function incrementCounter(req, res, next) {
    var app = req.rendrApp
      , count = app.get('session').count || 0;
    req.updateSession('count', count + 1);
    next();
  };
};
