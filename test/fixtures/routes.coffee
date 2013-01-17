module.exports =
  'users/login'                   : controller:'users', action:'login'
  'users/:id'                     : controller:'users', action:'show'
  'help'                          : controller:'help', action:'index'

# module.exports = (match) ->
#   match 'users/login', 'users#login'
#   match 'users/:id',   'users#show'
#   match 'help',        'help#index'
