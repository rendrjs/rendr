/**
  Plug in desired logger library and functionality here -- use this as an interface
*/
var winston = require('winston');

var logger = new winston.Logger({
  transports: [new winston.transports.Console()]
});

module.exports = logger;
