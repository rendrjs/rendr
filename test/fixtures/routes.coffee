module.exports = (match) ->
  match 'users/login', 'users#login'
  match 'users/:id',   'users#show'
  match 'help',        'help#index'
