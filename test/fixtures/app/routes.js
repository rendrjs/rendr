module.exports = function(match) {
  match('users/login', 'users#login');
  match('users/:id', 'users#show');
  match('test', 'test#index');
  match(/^\/regexp\/(foo|bar)/, 'test#regexp');
};
