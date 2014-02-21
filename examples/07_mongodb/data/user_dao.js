var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  login: { type: String },
  id: { type: Number },
  avatar_url: { type: String },
  gravatar_id: { type: String },
  url: { type: String },
  html_url: { type: String },
  followers_url: { type: String },
  following_url: { type: String },
  gists_url: { type: String },
  starred_url: { type: String },
  subscriptions_url: { type: String },
  organizations_url: { type: String },
  repos_url: { type: String },
  events_url: { type: String },
  received_events_url: { type: String },
  type: { type: String },
  site_admin: { type: Boolean }
});

UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;
