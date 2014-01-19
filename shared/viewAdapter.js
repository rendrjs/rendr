var requireAMD = require,
  _ = require('underscore'),
  async = require('async');

/*
 * A ViewAdapter implements two methods.
 *
 * The first is a `getView` method, which is used to turn a string name of a
 * view into a constructor for a View.
 *
 * The second is an `attach` method, which is called in browser scope. `attach`
 * finds all elements in the DOM that should be attached to View objects and
 * construct them with the proper arguments.
 *
 */

module.exports = ViewAdapter;
function ViewAdapter() {};


/* Public: turn a view's name into a view class
 *
 * viewName  - the name of the view to find
 * entryPath - the entryPath of the rendr app
 * callback  - an optional callback to pass the view class to instead of returning
 *
 * Returns a View class
 */
ViewAdapter.prototype.getView = function(viewName, entryPath, callback) {
    var viewPath;

    if (!entryPath) entryPath = '';

    viewPath = entryPath + "app/views/" + viewName;
    // check for AMD environment
    if (typeof callback == 'function') {
      // Only used in AMD environment
      if (typeof define != 'undefined') {
        requireAMD([viewPath], callback);
      } else {
        callback(require(viewPath));
      }
    } else {
      return require(viewPath);
    }
  };


/* Private: extract rendr-generated options from an element's `data`
 * attributes. JSON-encoded options are parsed and returned as sub objects.
 *
 * $el - the jquery object to extract options from
 *
 * Returns an object containing the options.
 *
 */
ViewAdapter.prototype._optionsFromElement = function($el) {
  var options = $el.data(),
      parsed;
  _.each(options, function(value, key) {
    if (_.isString(value)) {
      parsed = _.unescape(value);
      try {
        parsed = JSON.parse(parsed);
      } catch (err) {}
      options[key] = parsed;
    }
  });
  return options;
}

/* Public: attach Views to all elements of the DOM that need it
 *
 * app        - the Rendr app
 * parentView - the containing node to attach within
 *
 * Returns nothing, calls callback with an array of attached views
 */
ViewAdapter.prototype.attach = function(app, parentView, callback) {
  var $scope = parentView ? parentView.$el : $('body'),
      _this = this,
      list;

  // Find all elements with a data-view attribute in $scope that don't have a
  // parent element with a data-view attribute in $scope
  list = $scope.find('[data-view]').filter(function(i,el){
    return $(el).parentsUntil($scope).filter('[data-view]').length == 0
  }).toArray();

  async.map(list, function(el, cb) {
    var $el, options, parsed, viewName;
    $el = $(el);
    if (!$el.data('view-attached')) {
      options = _this._optionsFromElement($el)
      options.app = app;

      viewName = options.view;

      _this.getView(viewName, app.options.entryPath, function(ViewClass) {
        ViewClass.attachNewInstance($el, parentView, options, function(err,view) {
          cb(err, view);
        });
      });
    } else {
      cb(null, null);
    }
  }, function(err, views) {
    // no error handling originally
    callback(_.compact(views));
  });
};
