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

    if(req.url === "/"){
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.write("Home page with plain text");
        res.end();
    }
    else if(req.url === "/html"){
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.write("<h1>Hello html page</h1>"); // whatever you are putting in rew.write() it should be withing double quotes,  JSON.stringify() also returns string so there no need of double quotes.
        res.end();
    }
    else if(req.url === "/json"){
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({
            name: "Rahul",
            age: 30
        }))
        res.end();
    }
    else if(req.url === "/xml"){
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/xml");
        res.write(`
            <user>
                <name>Rahul</name>
                <age>30</age>
            </user>
        `)
        res.end();
        // notice I have used backticks(``) instead of double quotes.Although using double quotes is also valid but Read about backticks benefits.
    }
    else{
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html");
        res.write("<h2>Mind your url</h2>");
        res.end();
    }

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
*/
