var http = require('http');
var _ = require('underscore');

var srv = require("../../server/server");
var appServer =  new srv.Server();


var config = {
  host: 'localhost',
  port: 3030
}
var serverCount = 0;

function init(options) {
  if (options) {
    _.extend(config, options);
  }
}


function startServer(callback) {
  serverCount += 1;
  if (serverCount > 1) {
    return (typeof callback === 'function')  ? callback() : undefined;
  }

  appServer.init(function(err) {
    if (err) {
      return (typeof callback === 'function')  ? callback(err) : err;
    }

    appServer.start({port:config.port, server:config.host});
    return (typeof callback === 'function')  ? callback() : undefined;
  });
}

function stopServer(callback) {
  serverCount -= 1;

  // a bit of a race condition on shutdown -- just wait a bit and shutdown if count is 0
  if (serverCount == 0) {
    setTimeout(function() {
      if (serverCount === 0) {
        appServer.stop();
      }
    }, 500);
  }
  // don't wait for stop
  return (typeof callback === 'function')  ? callback() : undefined;

}


function login(name, api) {
  // TODO: not implemented
  return api;
}


/**
  Expect api with method, url, headers, postBody
*/
function makeRequest(api, callback) {
  if (!api || !api.url) return callback("missing url")
  http_request(config.host, config.port, api.url, api.headers, api.method || "GET", callback)
}


function http_request(host, port, url, headers, method, cb) {
  var options = {
    host: host,
    port: port,
    path: url,
    headers : headers,
    method: method
  };
  var ret = false;
  var req = http.request(options, function(res) {
    var buffer = '';
    res.body = '';
    res.setEncoding("utf8");
    res.on('data', function(data) {
      res.body += data;
    });
    res.on('end',function(){
      cb(null,res);
    });
  });
  req.end();
  req.on('error', function(e) {
      if (!ret) {
          cb(e, null);
      }
  });
}

// ===== PUBLIC =====
module.exports.init = init;
module.exports.startServer = startServer;
module.exports.stopServer = stopServer;
module.exports.login = login;
module.exports.makeRequest = makeRequest;
