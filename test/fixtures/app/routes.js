module.exports = function(addRoute) {
  addRoute('users/login', 'users#login');
  addRoute('users/:id', 'users#show');
  addRoute('test', 'test#index');
  addRoute(/^\/regexp\/(foo|bar)/, 'test#regexp');
};
