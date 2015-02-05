// Usage:
// clientTestHelper = require('../helpers/client_test');
// within describe:
//  before(clientTestHelper.before);
//  after(clientTestHelper.after);

var Backbone = require('backbone'),
    basePath = __dirname.split('/');
    basePath = basePath.splice(0, basePath.length-2).join('/');

exports.before = function(){
  global.window = require('jsdom').jsdom().parentWindow;

  global.window.test = true;
  global.window.$ = require('jquery')(global.window);
  global.window.history = {
    pushState: function () {;}
  };

  // Make sure we are not getting a cached version because it might not hvae the window object
  delete require.cache[basePath + '/shared/base/view.js'];

  var BaseView = require('../../shared/base/view');
  this.originalBackbonejQuery = Backbone.$;
  this.originalEnsure = BaseView.prototype._ensureElement;
  this.originalDelegate = BaseView.prototype.delegateEvents;

  BaseView.prototype._ensureElement = Backbone.View.prototype._ensureElement;
  BaseView.prototype.delegateEvents = Backbone.View.prototype.delegateEvents;
}

exports.after = function(){
  delete global.window;
  var BaseView = require('../../shared/base/view');
  Backbone.$ = this.originalBackbonejQuery;

  BaseView.prototype._ensureElement = this.originalEnsure;
  BaseView.prototype.delegateEvents = this.originalDelegate;

  // Make sure we are not getting a cached version because the next include might be a server require
  delete require.cache[basePath + '/shared/base/view.js'];
}
