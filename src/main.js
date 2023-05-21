const sh = require("./shared.js");

console.log(`  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR`);
console.log(`  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,`);
console.log(`  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE`);
console.log(`  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER`);
console.log(`  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING`);
console.log(`  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS`);
console.log(`  IN THE SOFTWARE.\n`);

if(process.env.DEBUG == undefined){
  console.log(`  [SXIS] v${sh.version()} written by senator`);
  console.log(`  [SXIS] NOTE: Debug text disabled, enable by passing "set DEBUG=*"`);
}
else
  sh.debug(`v${sh.version()} written by senator`);

if(!sh.fs.existsSync(sh.config.get("api.data_folder")))
  sh.fs.mkdirSync(sh.config.get("api.data_folder"));

sh.net.createServer(function(req, res){
  if(req.method === "POST"){
    sh.print(req, "POST");

    if(req.headers.key == undefined || req.headers.key != sh.config.get("api.key")){
      sh.respond(req, res, "Error - \"key\" header missing or invalid", 403);
      return;
    }

    if(req.headers.file == undefined){
      sh.respond(req, res, "Error - \"file\" header missing or invalid", 403);
      return;
    }

    // Extract extension from the file
    var match = req.headers.file.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    if(match == undefined){
      sh.respond(req, res, "Error - \"file\" is invalid", 403);
      return;
    }

    // Make the extension exploit safe and check if its on the whitelist (If thats enabled)
    var ext = match[0].toLowerCase().replace(/[^a-zA-Z0-9.]+/g, "");
    if(!sh.is_extension_whitelisted(ext)){
      sh.respond(req, res, "Error - \"" + ext + "\" is not a whitelisted extension", 403);
      return;
    }

    var buffer      = [];
    var buffer_len  = 0;
    req.on("data",function(data){
      if(buffer == undefined)
        return;

      buffer_len += data.length;
      if(buffer_len >= sh.config.get("api.max_upload_size_bytes")){
        delete buffer;
        buffer = undefined;
        return;
      }

      buffer.push(data);
    });
    sh.print(req, "Awaiting buffer...");

    req.on("end",function(){
      if(buffer == undefined){
        sh.respond(req, res, `Error - Maximum filesize exceeded (Max: ${sh.format_len(sh.config.get("api.max_upload_size_bytes"))})`, 413);
        return;
      }

      if(buffer.length < 1){
        sh.respond(req, res, `Error - filesize too small (Min: 1)`, 413);
        return;
      }

      const binary = Buffer.concat(buffer);
      sh.print(req, `Received buffer {len: "${sh.format_len(binary.length)}"}`);

      var file_name = sh.sf.handle_store_file(binary, ext);
      delete buffer;

      if(file_name == undefined){
        sh.respond(req, res, `Error - Error while storing file`, 413);
        return;
      }

      res.writeHead(200, {"Content-Type": "text/plain"});
      res.end(sh.config.get("listen.url") + file_name);
    });
  }
  else if(req.url.length > 1){
    // 1. Only allow aA-zZ/0-9/.
    // 2. Extract extension from file_name
    // 3. Remove any weird inputs by splitting and collecting before dot
    var file_name = req.url.toLowerCase().replace(/[^a-zA-Z0-9.]+/g, "");
    var ext       = file_name.match(/[^\\]*\.(\w+)$/);
        file_name = file_name.split(".")[0];

    // Check to see if extension valid
    if(ext == undefined || ext[1] == undefined){
      sh.respond(req, res, `Not Found`, 404);
      return;
    }
    ext = ext[1]; // Swap to extension block

    // This is the correct input
    var wish_file_path  = sh.config.get("api.data_folder") + file_name + `.${ext}`;
    var data            = sh.sf.handle_read_file(wish_file_path, file_name, ext);

    if(data == undefined || !sh.fs.existsSync(data.file_name)){
      sh.respond(req, res, `Not Found`, 404);
      return;
    }

    // Swap to real file path
    wish_file_path = data.file_name;

    const content_type = sh.mime.lookup(wish_file_path);
    if(content_type == undefined){
      sh.respond(req, res, "Not Found (1)", 403);
      return;
    }

    const file_size = sh.fs.statSync(wish_file_path).size;
    if(content_type == "video/mp4"){
      const range = req.headers.range;

      if(range){
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end   = parts[1] ? parseInt(parts[1], 10) : (file_size - 1);

        if(start >= file_size){
          res.status(416).send(`Range Not Satisfiable\n${start} >= ${file_size}`);
          return;
        }

        const file = sh.fs.createReadStream(wish_file_path, {start, end});
        res.writeHead(206, {
          "Content-Range":  `bytes ${start}-${end}/${file_size}`,
          "Accept-Ranges":  "bytes",
          "Content-Length": (end - start) + 1,
          "Content-Type":   content_type,
        });
        file.pipe(res);

        sh.print(req, `Buffered {file: "${wish_file_path}", len: "${sh.format_len((end - start) + 1)}", type: "${content_type}"}`);
      }
      else{
        res.writeHead(200, {
          "Content-Length": file_size,
          "Content-Type": content_type,
        });
        sh.fs.createReadStream(wish_file_path).pipe(res);

        sh.print(req, `Served stream {file: "${wish_file_path}", len: "${sh.format_len(file_size)}", type: "${content_type}"}`);
      }
    }
    else{
      res.writeHead(200, {"Content-Type": content_type});
      res.end(data.buffer);
      sh.print(req, `Served {file: "${wish_file_path}", len: "${sh.format_len(file_size)}", type: "${content_type}"}`);
    }
  }
  else{
    req.connection.destroy();
    return;
    //res.writeHead(200, {"Content-Type": "text/plain"});
    //res.end(sh.name());
  }

}).listen(sh.config.get("listen.port"), sh.config.get("listen.host"));

// Let the user know the service is ready
{
  if(process.env.DEBUG == undefined)
    console.log(`  [SXIS] Ready {listening: "${sh.config.get("listen.host")}:${sh.config.get("listen.port")}", site: "${sh.config.get("listen.url")}"}`);
  else
    sh.debug(`Ready {listening: "${sh.config.get("listen.host")}:${sh.config.get("listen.port")}", site: "${sh.config.get("listen.url")}"}`);

  console.log("");
}

// Create our auto clean up thread
if(sh.config.get("cleanup.enabled") && sh.config.get("cleanup.check_time_seconds") > 0 && sh.config.get("cleanup.max_file_life_seconds") > 0)
  setInterval(function(){
    const t = new Date().getTime()/1000|0;

    sh.fs.readdirSync(sh.config.get("api.data_folder")).forEach(function(file){
      const stats = sh.fs.statSync(sh.config.get("api.data_folder") + file);
      const delta = (t - (stats.birthtimeMs/1000|0));

      if(delta < sh.config.get("cleanup.max_file_life_seconds"))
        return;

      sh.debug(`Deleted expired file {file: ${file}, delta: ${delta}s}`);
      sh.fs.unlinkSync(sh.config.get("api.data_folder") + file);
    });
  }, sh.config.get("cleanup.check_time_seconds") * 1000);