# root path to rendr lib
exports.rootDir = __dirname + '/../..'

exports.entryPath = (process.env.PWD || '.') + '/app';  # path to parent-package/app directory
console.log("entryPath=", exports.entryPath);
exports.viewDir = exports.entryPath + '/views'
exports.publicDir = exports.entryPath + '/../public'
exports.staticDir = exports.entryPath + '/../static'
exports.assetsDir = exports.entryPath + '/../assets'
exports.templatesDir = exports.entryPath + '/templates'