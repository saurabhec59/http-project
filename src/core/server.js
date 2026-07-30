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
import responseBuilder from './response-builder.js';
import { addRoute, matchRoute} from './router.js';
import {homeHandler, htmlHandler, jsonHandler, xmlHandler, debugRequestHandler, emptyResponseHandler, redirectToHomePageHandler, downloadTextFileHandler, urlNotFoundHandler, methodNotAllowedHandler} from './routes/general.js';

addRoute("GET", "/", homeHandler);
addRoute("GET", "/html", htmlHandler);
addRoute("GET", "/json", jsonHandler);
addRoute("GET", "/xml", xmlHandler);
addRoute("GET", "/debug/request", debugRequestHandler);
addRoute("GET", "/empty", emptyResponseHandler);
addRoute("GET", "/redirect", redirectToHomePageHandler);
addRoute("GET", "/download", downloadTextFileHandler);

const server = http.createServer(function(req, res){
    console.log("Request received");
    console.log("url: " + req.url + " method: " + req.method);
    // logging 'req' object #1
    console.log("method: " + req.method);
    console.log("url: " + req.url);
    console.log("header: " + req.headers);
    console.log("http version: " + req.httpVersion);
    // logging a particular header:
    console.log("host from request header: " + req.headers.host);
    console.log("agent type from request header: " + req.headers["user-agent"]); // node converts headers into objects and also converts keys of req headers into lower case, that's why we did "user-agent" instead of "User-Agent"
    console.log("accept header from request header:" + req.headers.accept);
    // logging socket object #2
    console.log("socket: " + req.socket);
    console.log("IP of client: " + req.socket.remoteAddress);
    console.log("IP of host/server: " + req.socket.localAddress);
    console.log("port of host/server: " + req.socket.localPort);

    //  #3... req methods: read first the comment section #3
    // "data" event: when a request contains body/payload then 'req' object emits "data" event and here in our below implementation we are registering
    // a callback function for that event.
    // for 1 http request this callback method can be called multiple times as well because most of the times entire payload do not comes together at once
    // to process, node passes chunks of that data like if payload is { "name": "Rahul", age: 30 } then may be for this payload node can send
    // { "nam     ==> only this much data will be passed to callback argument(chunk) and method will be called. Then again
    // e": "Rahul",  ===> only this much data will be passed to callback.....and method will be called....
    // so for a single request containing body, this callback can be called multiple times. NOTE: here 'chunk' is not of type String, it's Buffer (we will see later)
    req.on("data", function(chunk){
        // processing of chunks
        console.log(chunk);
    });

    // "end" event: when there is no more body/payload data left to send then 'req' object emits this event.
    // usually used for post processing of entire received payload.
    req.on("end", function(){     // notice no arg is passed
        console.log("no more payload");
    });

    // there are others events as well like "close" ==> which is used when connection is closed, browser closed suddenly, TCP connection terminated. Few more events are "error", "destroy"....

    var handler = matchRoute(req.method, req.url);
    handler(req, res);

})


const port = 3000;
server.listen(port, function(){
    console.log("server is listening on port " + port);
})

/* it is always a good practice to include 'status code' and 'content-type' in each response sent to client. If we don't then by default the status code will be 200 but node.js
will not set content-type in response header.
usually there are 2 common ways to to this:
    res.writeHead(200, {
        "Content-Type": "application/json"
    });
OR:
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");

if we are using res.setHeader() and we have to set multiple headers then we can do it like:
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Powered-By", "Node.js");
    res.setHeader("Access-Control-Allow-Origin", "*");

    #1.....
    "req" <== it is an instance of http.IncomingMessage representing incoming requests
    just like any object, it has both method and properties.
    properties like: req.method,  req.url,  req.headers, req.socket....
    #2......
    req.socket: HTTP travel over TCP and each request comes through TCP socket. req.socket is a big object but few important ones are logged in above.
    #3.....
    When Node receives an HTTP request, the 'req' object emits various events during the lifetime of that request. for ex: If the request contains a body,
    it emits events like "data", "end"... The 'req' object provides the on() method, which allows us to register callback functions for specific events.
    Whenever one of those events is emitted, Node calls the corresponding callback function, allowing our code to respond to that event.
    write(): what ever we are passing in res.write() can be done or passed directly in res.end() as well. so why we need res.write()? Because res.end() sends
    entire content at once to client. Suppose there is a huge file available in multiple parts on server needs to be sent to client and if we put it into res.end() then
    server will first process all the files together then send at once to client and till that time client will be waiting.
    but if we do res.write("part1 of data"); res.write("part 2 of data")....res.write("last part"); then res.end();
    this way client will keep receiving the data parts and once end() will be called, node will signal client that data send is over.

    res.writeHead(): instead of doing
    res.statusCode = 404;
    res.setHeader("Content-Type", "plain/text");
    res.setHeader("Cache-Control", "no-cache");

    we can do:
    res.writeHead(404, {
        "Content-Type": "plain/text",
        "Cache-Control": "no-cache"
    })

    when headers are send? during the execution of res.write() or res.writeHead() or res.end(), not after them.

*/
