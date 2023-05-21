const debug_enc = require("debug")("SXIS/encode_handler");
const debug_dec = require("debug")("SXIS/decode_handler");
const sh        = require("./shared.js");

// Creates a id and key pair for a buffer
exports.create_pair = function(buffer){
  var hash = sh.crypto.createHash("sha256").update(buffer).digest("hex");
  var bit  = sh.config.get("file.aes_bit") / 8;
  return {
    id:   hash.substring(0,bit).toLowerCase(),
    key:  hash.substring(bit,bit*2).toLowerCase(),
    full: hash.substring(0,bit*2).toLowerCase()
  };
}

// Splits id and key from file hash input
exports.create_pair_from_file_hash = function(hash){
  var bit  = sh.config.get("file.aes_bit") / 8;
  if(hash == undefined || hash.length != (bit*2))
    return undefined;

  return {
    id:   hash.substring(0,bit).toLowerCase(),
    key:  hash.substring(bit,bit*2).toLowerCase(),
    full: hash.substring(0,bit*2).toLowerCase()
  };
}

exports.buffer_to_bytes = function(buffer){
  return Uint8Array.from(buffer);
}

exports.str_to_bytes = function(str){
  return Uint8Array.from(Buffer.from(str));
}

exports.bytes_to_buffer = function(bytes){
  return Buffer.from(bytes);
}

// Handles the encoding of a file before its stored
// For instance: Compression / AES
exports.encode_handler = function(buffer, key, ext){
  if(!sh.config.get("file.aes") && !sh.config.get("file.compress"))
    return buffer;

  // !IMPORTANT!
  // Currently SXIS Does't support encryption on stream files
  // Such as MP3 Audio and MP4 Video/Audio
  if(ext == ".mp3" || ext == ".mp4")
    return buffer;

  // 1. Create key array
  var aes_key = exports.str_to_bytes(key);

  // 2. Convert buffer to byte array
  var bytes   = exports.buffer_to_bytes(buffer);

  // 3. Compress byte array (lossless)
  if(sh.config.get("file.compress")){
    debug_enc(`Compressing...`);

    bytes = sh.snappyjs.compress(bytes);
    debug_enc(`Compression OK {new_size: "${sh.format_len(bytes.length)}"}`);
  }

  // If we aren't using AES, return here
  if(!sh.config.get("file.aes"))
    return exports.bytes_to_buffer(bytes);

  debug_enc(`Encrypting with AES ${sh.config.get("file.aes_bit")}bit`);

  // 4. Encrypt bytes
  // 5. Convert bytes to buffer
  var ctr     = new sh.aesjs.ModeOfOperation.ctr(aes_key, undefined);
  var enc     = ctr.encrypt(bytes);
      enc     = exports.bytes_to_buffer(enc);

  debug_enc(`AES ${sh.config.get("file.aes_bit")}bit OK`);

  return enc;
}

// Handles the decoding of a file before its fetched
// For instance: Compression / AES
exports.decode_handler = function(buffer, key, ext){
  if(!sh.config.get("file.aes") && !sh.config.get("file.compress"))
    return buffer;

  // !IMPORTANT!
  // Currently SXIS Does't support encryption or compression on stream files
  // Such as MP3 Audio and MP4 Video/Audio
  if(ext == ".mp3" || ext == ".mp4")
    return buffer;

  // 1. Create key array
  // 2. Convert buffer to byte array
  var aes_key = exports.str_to_bytes(key);
  var bytes   = exports.buffer_to_bytes(buffer);

  // 3. Decrypt byte array
  if(sh.config.get("file.aes")){
    debug_enc(`Decrypting AES ${sh.config.get("file.aes_bit")}bit`);
    var ctr = new sh.aesjs.ModeOfOperation.ctr(aes_key, undefined);
    bytes   = ctr.decrypt(bytes);
    debug_enc(`Decryption OK`);
  }

  // 4. Uncompress byte array (lossless)
  if(sh.config.get("file.compress")){
    debug_dec(`Decompressing file...`);
    bytes = sh.snappyjs.uncompress(bytes);
    debug_dec(`Decompression OK`);
  }

  // 5. Convert bytes back to buffer
  bytes = exports.bytes_to_buffer(bytes);

  return bytes;
}

exports.handle_store_file = function(buffer, ext){
  if(buffer == undefined || ext == undefined)
    return undefined;

  var pair      = exports.create_pair(buffer);
  var enc       = exports.encode_handler(buffer, pair.key, ext);
  var wish_path = sh.config.get("api.data_folder") + pair.id + ext;

  if(!sh.fs.existsSync(wish_path))
    sh.fs.writeFileSync(wish_path, enc);

  delete enc;
  return pair.full + ext;
}

exports.handle_read_file = function(file_name, file_hash, ext){
  if(file_name == undefined || file_hash == undefined)
    return undefined;

  // Create pair from full hash
  var pair = exports.create_pair_from_file_hash(file_hash);
  if(pair == undefined)
    return undefined;

  // Convert file name to full path
  file_name = sh.config.get("api.data_folder") + pair.id + `.${ext}`;

  // If the file doesnt exist, return undefined
  if(!sh.fs.existsSync(file_name))
    return undefined;

  // Read buffer
  var buffer  = sh.fs.readFileSync(file_name);
  var dec     = exports.decode_handler(buffer, pair.key, `.${ext}`);
  delete buffer;

  // TODO:
  // If dec == undefined then return undefined and error to client
  // That the file is corrupt

  return {
    buffer:     dec,
    file_name:  file_name
  };
}