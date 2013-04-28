if (typeof window !== "undefined" && window !== null) {
  window.isServer = false;
  window.global = window;
  global.rendr = {
    entryPath: ''
  };
} else {
  global.isServer = true;
  global.rendr = {
    entryPath: process.cwd()
  };
}
