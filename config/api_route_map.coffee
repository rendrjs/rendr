# Map our server routes to backend api routes (if there is a difference)
module.exports = 
  '/listings'               : {apiPath:'/listings/search', statsd:'search'}
  '/phrases'                : {apiPath:'/phrases/mobile_web'}
