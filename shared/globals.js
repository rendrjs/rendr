if (typeof window !== "undefined" && window !== null) {
  window.isServer = false;
  window.global = window;
} else {
  global.isServer = true;
}
