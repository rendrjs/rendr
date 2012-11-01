# Point to current environment/config values
env = process.env.NODE_ENV || 'development'

exports.get = (env) ->
  return require('./'+env).config

exports.name = env
exports.current = exports.get(env)

