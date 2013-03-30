module.exports = (match) ->
  match 'users/login', 'users#login'
  match 'users/:id',   'users#show'
  match 'test',        'test#index'
