module.exports =
  admin: (req, res, next) ->
    console.log("verify admin permissions")
    next()

  user: (req, res, next) ->
    console.log("verify user permissions")
    next()

  guest: (req, res, next) ->
    console.log("lookup guest")
    next()


