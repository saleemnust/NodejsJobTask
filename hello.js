var http = require("http");

nphttp.createServer(function (req, res) {
    res.writeHead(200, {"Content-Type" : "text/plain" });
    res.end("Hello world");

}).listen(4000);

console.log("Server is running at http://127.0.0.1/4000");
