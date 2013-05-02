module.exports = {
  show: function(params, callback) {
    callback(null, "users_show_view", {});
  },
  login: function(params, callback) {
    callback(null, "useres_login_view", {});
  }
};
