/*
    node.js provides a built-in module 'http' that allows us to create HTTP servers to handle HTTP requests and responses.
    to create the instance of HTTP server, we use method createServer() of 'http' module.
    for which port node is going to listen to requests is determined by method listen() of serer instance and also this is the method which starts the server.
    When we start the server, it tells os that Node is listening to requests coming to port determined in listen().
    Now when a request comes to that port, os forwards this to Node and server instance receives this request, then callback function of createServer() is executed.
    this callback function receives two objects (req, res) as parameters. object parameter 'req' contains incoming request details like:
    req.url, req.method, req.headers
    and 'res' contains methods like write(), end() to send response back to the client.
    the callback function of createServer() is executed by server instance only when a request is received.
*/
import http from 'http';

const server = http.createServer(function(req, res){
    console.log("Request received");
    console.log("url: " + req.url + " method: " + req.method);
    //
    res.write("you reached the server"); // write() method adds data to response body sent back to the client

    // end() method signals to client that the response has been sent and the connection can be closed.
    res.end();
})


const port = 3000;
server.listen(port, function(){
    console.log("server is listening on port " + port);
})