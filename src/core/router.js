import {urlNotFoundHandler, methodNotAllowedHandler} from "./routes/general.js";

var routes = {};
routes.GET = {};
routes.POST = {};
routes.PUT = {};
routes.DELETE = {};

function addRoute(method, path, handler) {
    routes[method][path] = handler;
}

// #2........
function matchRoute(method, url){
    if(!routes[method]){
        return methodNotAllowedHandler;
    }

    var requestUrlSplit = url.split("/");
    // split("/"); => divides string by "/" and creates an array. for ex: if url is "/users/item/5"  then after split it will be converted into an array => [ "", "users", "item", "5"]
    // visiting each registered url for particular 'method'
    for(var i in routes[method]){
        // var i in users[method] => will iterate over all the registered urls in users[method] like if 'method' is 'GET' then this outer loop will be iterating over all urls listed in users.GET

        var check = true; // setting it to true otherwise if 1st registered url for that method is not matched then it will set to false and even if next url is matched then also check will be false and above if() will never be true;
        var registeredUrlSplit = i.split("/");
        if(requestUrlSplit.length != registeredUrlSplit.length){
            continue; // if no of parts are not equals then no need to compare individual parts.
        }
        for(var j=0; j<registeredUrlSplit.length; j++){
            if(registeredUrlSplit[j].startsWith(":") || registeredUrlSplit[j] === requestUrlSplit[j]){
                continue; // no need to compare
            }
            else{
                check = false;
                break;
            }
        }
        // if above loop is finished and check is still true means no of parts and indivisual parts matched. Means we find the correct registered route and will return it's handler
        if(check){
            return routes[method][i];
        }

    }


    for(var currentMethod in routes){
        if(routes[currentMethod][url]){
            return methodNotAllowedHandler;
        }
    }
    return urlNotFoundHandler;
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

#1........
till now if there is no handler for requested url then we were sending 404 response directly from server.js like this:
var handler = matchRoute(req.method, req.url);
    if(handler){
        handler(req, res);
    }
    else{
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html");
        res.write("<h2>Mind your url</h2>");
        res.end();
    }
but there was few problems with that approach like server.js is creating response directly, second is if requested url exist but not under requested method then correct response is 405.
valid approach should be:
-> if requested method & url is found then return it's handler
-> if requested url exist but not under requested method then return 405 ( method not allowed )
-> if requested url itself does not exist then return 404

#2......
Initially routes were matched using exact string comparison only: /users/1 === /users/1

Now it also supports parameterized routes/ dynamic routes:
    registered route: /users/:id
    requested URL:    /users/25

Here ":id" acts as a route parameter and can match any value at that position.

The function compares URL segments one by one and returns the corresponding handler
when a matching route pattern is found.
*/
*/