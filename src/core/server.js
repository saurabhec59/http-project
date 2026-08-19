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
import {homeHandler, htmlHandler, jsonHandler, xmlHandler, debugRequestHandler, emptyResponseHandler, redirectToHomePageHandler, downloadTextFileHandler, urlNotFoundHandler, methodNotAllowedHandler, echoParsedBodyHandler} from './routes/general.js';
import {getAllUsersHandler, createUserHandler, getUserByIdHandler, partialUpdateByIdHandler, fullUpdateByIdHandler, deleteUserHandler} from './routes/users.js';
import {getAllProductsHandler, getProductByIdHandler, createProductHandler, updateProductHandler, deleteProductHandler} from './routes/products.js';
import {parseBody} from '../middleware/body-parser.js';
import {badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError, unsupportedMediaType} from '../utils/error-responses.js';
import {setCorsHeaders} from '../middleware/cors.js';
import {info, warn, error, debug} from '../utils/logger.js';
import {requestLogger} from '../middleware/request-logger.js';
import {serveStaticFile} from '../middleware/static.js';
import STATUS_CODES from '../utils/status-codes.js';
import {parseQueryString} from '../utils/query-parser.js';
import {temperingJwt} from '../auth/token.js';
import {pool} from '../db/connection.js';
import {findCustomerByEmail, createCustomer} from '../repositories/customer-repo.js';
import {createCustomerHandler, loginCustomerHandler} from './routes/auth.js';

addRoute("GET", "/", homeHandler);
addRoute("GET", "/html", htmlHandler);
addRoute("GET", "/json", jsonHandler);
addRoute("GET", "/xml", xmlHandler);
addRoute("GET", "/debug/request", debugRequestHandler);
addRoute("GET", "/empty", emptyResponseHandler);
addRoute("GET", "/redirect", redirectToHomePageHandler);
addRoute("GET", "/download", downloadTextFileHandler);
addRoute("GET", "/users", getAllUsersHandler);
addRoute("POST", "/users", createUserHandler);
addRoute("GET", "/users/:id", getUserByIdHandler); // #4......
addRoute("PATCH", "/users/:id", partialUpdateByIdHandler);
addRoute("PUT", "/users/:id", fullUpdateByIdHandler);
addRoute("DELETE", "/users/:id", deleteUserHandler);
addRoute("POST", "/echo", echoParsedBodyHandler);
addRoute("GET", "/products", getAllProductsHandler);
addRoute("GET", "/products/:id", getProductByIdHandler);
addRoute("POST", "/products", createProductHandler);
addRoute("PUT", "/products/:id", updateProductHandler);
addRoute("DELETE", "/products/:id", deleteProductHandler);
addRoute("POST", "/auth/register", createCustomerHandler);
addRoute("POST", "/auth/login", loginCustomerHandler);

const server = http.createServer(async function(req, res){
    requestLogger(req, res);
    //const result = await createCustomer("dummyDanny@gmail.com", "Danny", 25, "newYork");
//    console.log(result);

    try{
        if(await serveStaticFile(req, res)){ return; }; // if static server returned true means file found and send, if false means continue to matchRoute(), if error means return 500
    }catch(e){
        var message = internalServerError("Internal Server Error");// #7. why not internalServerError(e.message)?
        responseBuilder.sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, message);
        return;
    }

    directConsoleLogger(req);//removed console.log statements from here.

    setCorsHeaders(req, res); // before processing the request we are checking if client has sent Origin header then attach the response header to 'res'
    // #6......Using body-parser middleware
    var method = req.method;
    if(method === "POST" || method === "PUT" || method === "PATCH"){
        try{
            req.body = await parseBody(req);
        }catch(e){
            // parseBody() attaches a statusCode to each error so we know exactly which HTTP response to send.
            if(e.statusCode === STATUS_CODES.REQUEST_TIMEOUT){//408
                var message = requestTimeOut(e.message);
                responseBuilder.sendErrorResponse(res, STATUS_CODES.REQUEST_TIMEOUT, message);
            } else if(e.statusCode === STATUS_CODES.PAYLOAD_TOO_LARGE){ //413
                var message = payloadTooLarge(e.message);
                responseBuilder.sendErrorResponse(res, STATUS_CODES.PAYLOAD_TOO_LARGE, message);
            } else if(e.statusCode === STATUS_CODES.UNSUPPORTED_MEDIA_TYPE){ //415
                var message = unsupportedMediaType(e.message);
                responseBuilder.sendErrorResponse(res, STATUS_CODES.UNSUPPORTED_MEDIA_TYPE, message);
            }
            else {
                var message = badRequest(e.message);
                responseBuilder.sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, message);//400
            }
            return;
        }
    }

    var parsedUrl = new URL(req.url, "http://localhost:3000");
    var routeResult = matchRoute(req.method, parsedUrl.pathname); // #5..... sending only pathname to matchRoute() because query string is not part of route matching.
    req.params = routeResult.params;
    var parsedQuery = parseQueryString(parsedUrl.searchParams); // this will return an object containing key-value pairs of query string params.
    req.query = parsedQuery; // attaching this to req object so that handlers can use it.
    routeResult.handler(req, res);

})


const port = 3000;
server.listen(port, function(){
    info("server is listening on port " + port);
})

// this method is created to just clean the code inside createServer() callback and keeping previous learning codes. It is not adding something new.
function directConsoleLogger(req){
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
    // a callback function for that event.//
    // for 1 http request this callback method can be called multiple times as well because most of the times entire payload do not comes together at once
    // to process, node passes chunks of that data like if payload is { "name": "Rahul", age: 30 } then may be for this payload node can send
    // { "nam     ==> only this much data will be passed to callback argument(chunk) and method will be called. Then again
    // e": "Rahul",  ===> only this much data will be passed to callback.....and method will be called....
    // so for a single request containing body, this callback can be called multiple times. NOTE: here 'chunk' is not of type String, it's Buffer (we will see later)


    // there are others events as well like "close" ==> which is used when connection is closed, browser closed suddenly, TCP connection terminated. Few more events are "error", "destroy"....

}
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

#4.......
Here we are only registering the routes, next we will implement actual handlers.
lets understand "/users/:id"   ==> this is parameterized/dynamic routing. NOTE: clients do not send routes/urls like this. Then why we are registering url like this?
previously we are registering exact url which client sends like "/users" , "/users/xml"...
but suppose there is a list of 50 users and when the client will ask for details of any particular user then url may look like "/users/1", "/users/2"..."/users/50"
but we can't just register those 50 exact urls. So what we can do is we can register a url like:
"/users/:id"   => here ":id" is nothing special syntax, it's just part of the string but by convention where we need to specify parameters we does ":" and 'id' is just
a variable name and it could be anything else as well. See the update routeMatch() function to understand how we are using this.
Remember: =>>> still client will send "users/1", "users/2".... It's us on only server side registering it using ":"
NEXT I will be implementing extraction of parameters and then implementing these handlers.

#5....
see the matchRoute() and you will see that now it returns an object containing handler method reference and params object (empty params obj when no parameters present)
so here we are now attaching params to 'req' object and passing that updated 'ref' so that handler can use that.

#6.......
since we have created a body parser function in body-parser.js which is doing:
collecting the input stream => req.on("data").  ====> which was initially done by each handler
validating content-length and size of actual payload.
parsing the content:
    if client sent json => inside req.on("data") we read it as buffer => convert it into json inside req.on("end")   =====> which was initially done by our each handler
    if client sent url encoded => "..........." => convert it into normal js object  ====> which was initially done by our each handler

So now we can replace that entire processing of payload/body done by req.on("data") & req.on("end") from each handler method.
For that we have 2 options:
1-> replace that processing code from each handler with something like:  var data = await bodyParser(req);
2-> inside the server.js -> inside the createServer() method -> before doing any operation with 'req' or 'res' , call our body parser if methods are PUT, POST and PATCH
and create a property as "req.body" which will contain the parsed payload result. Now each handler receiving this request object have property "req.body" which they can directly use.
And this approach servers the purpose of 'middleware' more meaningfully.

#7...
Usually servers should not expose e.message directly to client if it's not your custom message like new Error("the error") because it may reveal sensitive info like paths etc to client,
that's we sending custom message. Also all other error objects which are build in this file like unsupportedMediaType(e.message); or payloadTooLarge(e.message); If you notice these Errors in
body-parser.js then these are custom errors like new Error("custom message"), so here 'e.message' is our written message.

TO-DO: update all reference of error response builders like send415Response, send404Response, send408Response... with sendErrorResponse as done in this file.
*/
