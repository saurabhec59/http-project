// #1... reason for this implementation
const allowedOrigins = [ "http://localhost:3000", "http://myfrontapp.com" ]; // list of allowed origins, you can add your frontend url here like: "http://localhost:3000" or "https://myfrontend.com"
function setCorsHeaders(req, res){
    var origin = req.headers["origin"];
    if(origin && allowedOrigins.includes(origin)){ // If Origin header is absent, the request is either same-origin or from a non-browser client (e.g. curl), so no CORS header is needed.
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
}

export { setCorsHeaders };

/*
CORS: Cross Origin Resource Sharing.
It is about js running in browser trying to read resources from a different origin. (Origin means scheme + host + port of url)
Ex:
In response of your request from server 'A.com' you get a js file, now your browser will start executing that js code.
That js code is containing fetch("http://B.com")   => means javaScript wants to access a resource or action from another server 'B.com'.
So browser will start preparing for the request and it will notice that this js file comes from 'A.com' and it wants to make another request:
to 'B.com'.
So before sending the request to B.com, it will add this additional header
GET http//B.com
Host: B.com
Origin: http://A.com    <== this additional header Origin

This additional header simply means "BROWSER" asking to "B.com" that do you know "A.com", not "A.com"
Now in the response of that request, Browser will look for the Header: Access-Control-Allow-Origin: http://A.com
If that header is present then only browser will allow js to read that  response results. Otherwise it will block that response for js.


Lets take an example to understand why this additional thing exist:
Suppose we typed http://evil.com    => in response browser get a js file as well. Now that js file contains a script like:
fetch("http://myBank.com/users", {
    method: "GET",
    headers:{
        Authorization: "Bearer xxxxx"
    }
})

Now without the concept of CORS, the browser may access my JWT token from system or even cookie and make this request and all my banking data is stolen.
But with CORS browser will see that this request is to another origin so it will add one more header in request Origin: http:evil.com

Preflight Request:
Coming to topic again,
There is a problem in existing approach:
By adding this additional Origin header, Browser is just preventing js to read the response, but the request of js is still getting processed by server.
Suppose the js fetch() request contains Methods like DELETE, PUT, PATCH then the chances are request will be processed by server.
That's why to prevent them browser checks Methods of those requests.
Usually if it's : (Simplified explanation)
GET then browser adds header Origin in request, let host B.com process that and based on it's response header " Access-Control-Allow-Origin "
it decides to let js read that response or not.
PUT, PATCH, DELETE... for these kind of methods, browser sends A preflight request.
Instead of sending GET, PATCH OR POST..., it sends method "OPTIONS" and request will look like:
OPTIONS /users
Host: http://B.com
Origin: http://A.com
Access-Control-Request-Method: DELETE

Response will be like:
200 OK
Access-Control-Allow-Origin: http://A.com
Access-Control-Allow-Methods: GET,POST,PUT,DELETE

Now if browser will find match for Origin and Allowed methods then it will make the js request.
This way BROWSER prevented user.

#1.....
for now we are implementing this cors middleware for scenario where browser is not sending preflight request
and just sending GET, POST, PUT, DELETE... request with additional header Origin.
And this function we are checking that if that send Origin is in our allowedOrigins list,
if it is then we are adding header Access-Control-Allow-Origin in response header so that browser will allow js to read that response.

Currently this middleware only handles normal cross-origin requests. Handling preflight (OPTIONS) requests will be added later.
*/