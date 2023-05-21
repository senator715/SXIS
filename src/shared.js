exports.net       = require("http");
exports.fs        = require("fs");
exports.config    = require("config");
exports.crypto    = require("crypto");
exports.mime      = require("mime-types");
exports.aesjs     = require("aes-js");
exports.snappyjs  = require("snappyjs");
exports.debug     = require("debug")("SXIS/");
exports.pkg       = require("./package.json");
exports.sf        = require("./securefile.js");

// Find extension for content type
exports.is_extension_whitelisted = function(ext){
  if(!exports.config.get("whitelist.enabled"))
    return true;

  var whitelist = exports.config.get("whitelist.extensions");
  for(var i = 0; i < whitelist.length; i++)
    if(ext === whitelist[i])
      return true;

  return false;
}

exports.version = function(){
  return exports.pkg.version;
}

// Return version name
exports.name = function(){
  return `SXIS ${exports.version()}`;
}

exports.last_ip = undefined;
exports.print = function(socket, msg){
  const ip = exports.ip(socket);

  if(exports.last_ip != ip){
    exports.debug(`[${ip}]`);
    exports.last_ip = ip;
  }

  exports.debug(`→ ${msg}`);
}
exports.respond = function(socket, res, msg, error_code = 200, content_type = "text/plain"){
  res.writeHead(error_code, {"Content-Type": content_type});
  res.end(`${exports.name()}\n\n${msg}`);

  exports.print(socket, `RESPOND: "${msg}"`);
}

exports.format_len = function(bytes, decimals = 2) {
  if(!+bytes)
    return "0 Bytes";

  const k     = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals))} ${sizes[i]}`;
}

// TODO;
// We should have a Cloudflare-only mode that blocks traffic apart from Cloudflare IPv4/IPv6.
exports.ip = function(socket){
  if(socket == undefined)
    return undefined;

  return socket.headers["cf-connecting-ip"] || socket.headers["x-forwarded-for"] || socket.connection.remoteAddress;
}