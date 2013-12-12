if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

define(function(require)
{

  return function(match) {
    match('',                   'home#index');
    match('repos',              'repos#index');
    match('repos/:owner/:name', 'repos#show');
    match('users'       ,       'users#index');
    match('users/:login',       'users#show');
  };

});
