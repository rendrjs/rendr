# User = require('./user')

STORAGE_KEY = 'session_manager'
ACCESS_TOKEN_KEY = 'access_token'

module.exports = class SessionManager# extends rendr.BaseModel

  activeUser: null

  checkCachedLogin: ->
    cachedData = @retrieve()
    accessToken = @readCookie(ACCESS_TOKEN_KEY)
    if !cachedData? && accessToken
      cachedData =
        access_token: accessToken
    if cachedData?
      @set(cachedData)
      @loginVerify()
    else
      @unset('access_token')

  loggedIn: ->
    access_token = @get('access_token')
    access_token && access_token != 'null'

  isActiveUser: (user) ->
    return false unless user && @activeUser
    user_id = if typeof(user) == 'object' then user.get('id') else user
    parseInt(user_id, 10) == parseInt(@activeUser.get('id'), 10)

  login: (params) ->
    options =
      url: '/authorize'
      method: 'POST'
      data: params
      success: @loginSuccess
      error: @loginFailure
    @save({}, options)

  loginSuccess: (model, resp) =>
    if model.get('access_token')
      @loginVerify()
    else
      @trigger 'failure', t "shared.Unknown Error"

  loginFailure: (model, xhr, response) =>
    if xhr?.responseText?
      data = JSON.parse xhr.responseText
      @trigger 'failure', data.error_message || data.error
    else
      @trigger 'failure', t "shared.Unknown Error"

  # Assumes that it has been handed a valid access token, and then verifies that the current session
  # is valid and stores the latest information about a user.
  loginVerify: =>
    @activeUser = new User @get('active_user')
    @trigger 'login'

    options =
      url: '/account/active'
      data: {oauth_token: @get('access_token')}
      error: @logout
      success: (model, resp) =>
        @activeUser = new User resp.user.user

        @app.State.set
          locale: resp.locale
          currency: resp.currency
          unread_messages: resp.unread.messages_count
          unread_alerts: resp.unread.alerts_count

        @persist
          active_user: @activeUser.toJSON()
          access_token: @get('access_token')

    @fetch(options)

  logout: =>
    @app.trigger 'flash', t 'login.logged_out.you have been logged out'
    @clear()
    @unset('access_token')
    @activeUser = null
    @trigger 'logout'

  signup: (userData) ->
    # We call save on `this` so that the response is saved
    # as attributes on the SessionManager. We pass in the
    # User-based url. We pass the data as an option so it's not
    # saved in SessionManager's attributes.
    @save {},
      success: @signupSuccess
      error: @signupFailure
      url: _.result(new User, 'url')
      data: userData

  signupSuccess: (model, response) =>
    @loginVerify()

  signupFailure: (model, xhr) =>
    body = JSON.parse xhr.responseText
    @trigger 'failure', if body.error_message then body.error_message else t 'mobile.nice error'

  facebook: ->
    FB.init {appId: '138566025676', logging: true, status: true, cookie: true, xfbml: false, oauth: true}

    FB.login (response) =>
      if response['status'] == 'connected'
        @login {assertion: response.authResponse.accessToken}

    , {scope: 'email'}

  persist: (data) ->
    if data.active_user
      @createCookie(ACCESS_TOKEN_KEY, data.access_token, 14)

    json_data = JSON.stringify(data)
    if @hasLocalStorage()
      localStorage.setItem STORAGE_KEY, json_data
    else
      @createCookie(STORAGE_KEY, json_data, 365)

  clear: ->
    @createCookie(ACCESS_TOKEN_KEY, '', 365)
    if @hasLocalStorage()
      localStorage.clear()
    else
      @createCookie STORAGE_KEY, '', 365

  retrieve: ->
    try
      if @hasLocalStorage()
        JSON.parse((localStorage.getItem(STORAGE_KEY) || 'null'))
      else
        console.log @readCookie(STORAGE_KEY)
        JSON.parse @readCookie(STORAGE_KEY)
    catch error
      null

  hasLocalStorage: ->
    window?.localStorage?

  createCookie: (name, value, days) ->
    if days
      date = new Date()
      date.setTime(date.getTime()+(days*24*60*60*1000))
      expires = "; expires="+date.toGMTString()
    else
      expires = "";
    document.cookie = name+"="+value+expires+"; path=/";

  #TODO CLEAN THIS UP MY GOD
  readCookie: (key) ->
    fn = `function(name){
    var nameEQ = name + "=",
        ca = document.cookie.split(';'),
        i, c;
    for (i=0; i < ca.length; i++) {
      c = ca[i];
      while (c.charAt(0)==' ') {
        c = c.substring(1,c.length);
      }

      if (c.indexOf(nameEQ) == 0) {
        return c.substring(nameEQ.length,c.length);
      }
    }
    return null;
    }`
    fn(key)
