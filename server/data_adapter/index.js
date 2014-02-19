module.exports = DataAdapter;

function DataAdapter(options) {
  this.options = options || {};
}

/**
 * `request`
 *
 * This is method that Rendr calls to ask for data. Stubbed out here, to be
 * subclassed to connect to whatever data souce you want your models and
 * collections to talk to.
 *
 * `req`: Actual request object from Express/Connect.
 * `api`: Object describing API call; properties including 'path', 'query', etc.
 *        Passed to `url.format()`.
 * `options`: (optional) Options.
 * `callback`: Callback.
 */
DataAdapter.prototype.request = function(req, api, options, callback) {
  throw new Error('Implement me!');
};
