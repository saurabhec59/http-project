var routes = {};
routes.GET = {};
routes.POST = {};
routes.PUT = {};
routes.DELETE = {};

function addRoute(method, path, handler) {
    routes[method][path] = handler;
}

function matchRoute(method, url){
    var handler = routes[method][url];
    if(handler){
        return handler;
    }
    else{
        return undefined;
    }
}

export {addRoute, matchRoute};

/*
till now inside the callback of createServer we are doing:
    if(req.method == "GET" && req.url === "/"){
        var text = "this is home page";
        responseBuilder.sendHtmlResponse(res, text);
    }

    here 2 responsibilities were happening:
    1. matching the url
    2. building body for response
    Note: response building (specially response Header) is handled by utility methods present in response-builder.js

Also notice one more thing, creating body content of response(which goes in res.write() and creating headers of response + sending entire response is 2 different responsibilites.

function of response-builder are utility/helper functions which
is responsible for generating
response headers mainly and sends the complete response.
function of general.js are actual handlers of urls which generates body content that needs to be send and then calls methods of response-builder along with body content.

solution:
is to create a separate file like router.js.
in that file create an object which will store url and it's handler, also create and expose a method which can add/register the routes.
also create and expose another method which can match the url and return related handler.
#....
lets understand how object is created to store the routes and it's handlers.

var routes = {}; ==> this creates a js object named routes.
routes.GET = {}; ==> it creates a property named "GET" inside routes object and make this property an object as well (because of {}).
so from routes.GET = {} ...... routes.DELETE = {};  ==> the routes object become like:
routes{
    GET{

    }
    ...
    DELETE{

    }
}

At the end how we wants to store/register all the routes as object as :
routes{
    GET{
        "/" = homeHandler;
        "/json" = jsonHandler;
        "/redirect" = redirectHandler;
        ....
    }
    ....
    DELETE{
        .....
    }
}

Lets see how addRoute() registers/ add a route and it's handler:
routes[method][path] = handler;  => in js if you know the property name then to access it's value we use dot like:
routes.GET."json" = jsonHandler   ==> this line means go to the property named json and assign it a value(handler) named jsonHandler
but if we don't know the property name as well then we use [] like:
routes[method][path] = handler;  => this line means I only know object name routes, so ultimatly this like will become:
routes.valueOfMethod.valueOfPath = valueOfHandler  => and all values are from argument of method addRoute.

#....matchRoute() work is to return the handler for requested path and url. Nothing else. It do not runs the handler, it just returns it.

In sort:
in router.js we created an object to store/register req method, req url and related handler.
exposing method addRoute to register/add url and it's handler
matchRoute method to get the related handler for particular method and req url

In server.js:
Doing like this:
addRoute("GET", "/", homeHandler); ==> to actually register/add req method, url and it's handler
inside the callback of createServer():
var handler = matchRoute(req.method, req.url);  ==> fetch the correct handler for req method and url
    if(handler){
        handler(req, res);   =========> calling that handler defined in general.js with same req, res object, further this will call utility/helper of response-builder with required body content.
    }
    else{
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html");
        res.write("<h2>Mind your url</h2>");
        res.end();
    }

NOTE: addRoute() is declared before createServer() so that once the application starts we will register all the routes and it's handlers.
Now inside the callback of createServer():
for each request we will fetch the related handler and call that.

So to add new route:
register it using addRoute() in server.js
define its handler in general.js
if additional utility required then create in response-builder.

*/