var UserModel = require('./user_dao'),
    RepositoryModel = require('./repository_dao'),
    get = require('./mongodb_adapter').get,
    query = require('./mongodb_adapter').query;

// map path to db query, model, & criteria
module.exports = function (path, callback) {
  var err,
      a = path.split("/");

  switch (a[1]) {
    case "repositories":
      callback(err, query, RepositoryModel, {});
      return;

    case "users":
      if (a.length == 2) {
        callback(err, query, UserModel, {});
        return;
      }
      else if (a.length == 3) {
        callback(err, get, UserModel, { "login": a[2] });
        return;
      }
      else if (a.length == 4 && a[3] === "repos") {
        callback(err, query, RepositoryModel, { "owner.login": a[2] });
        return;
      }
      break;

    case "repos":
      if (a.length == 4) {
        callback(err, get, RepositoryModel, { "owner.login": a[2], "name": a[3] });
        return;
      }
      break;
  }
  err = new Error("Cannot map " + path + " to db query");
  err.status = 500;
  err.body = path;
  callback(err);
};
