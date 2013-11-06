if (typeof window !== "undefined" && window !== null) {
  window.isServer = false;
  window.global = window;
  global.rendr = {
    entryPath: ''
  };
} else {
  global.isServer = true;
  var serverOnly_rendrIndex = '../index';
  global.rendr = require(serverOnly_rendrIndex);
}
