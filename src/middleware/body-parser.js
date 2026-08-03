/*
    Body parser is responsible only for parsing the request body/payload.
    Request body is received through the IncomingMessage stream events:  req.on("data") and req.on("end").
    Query parameters are different from request body. Example:
    GET /users?name=rahul&age=20

    Here:
    /users                -> pathname
    ?name=rahul&age=20    -> query string

    Query parameters should be parsed separately using URL parsing utilities and should not be handled inside body-parser middleware.
*/
function parseBody1(req){  // #1....
    var body = "";
    req.on("data", function(chunk){
        body += chunk;
    })

    req.on("end", function(){
        return body;
    })
}

// #2....
function parseBody(req){
    const MAX_BODY_SIZE = 1024 * 1024; // 1 MB
    return new Promise(function(onSuccess, onFailure){ // usually devs use 'resolve' and 'reject' instead of onSuccess and onFailure

        // preventing server from processing large malicious or fake requests ===>  #5......
        if(req.headers["content-length"] && parseInt(req.headers["content-length"]) > MAX_BODY_SIZE){
            onFailure(new Error("Request body too large"));
            return;
            /*
                it's not always guaranteed that each request with a body/payload will have header "Content-Length" but as for a preventive measure we can check that if client has sent that header
                then we can reject the request and further processing .
            */
        }

        var data = "";
        var chunkSize = 0;
        req.on("data", function(chunk){

            // although we are already checking content-length header size above but still client can fake that header and send large payload so we are checking the actual size of data received here.
            chunkSize += chunk.length;
            if(chunkSize > MAX_BODY_SIZE){
                onFailure(new Error("Request body too large"));
                req.destroy(); // this will stop further processing of request otherwise node can still keep receiving data.
                return;
            }

            data += chunk;
        })

        req.on("end", function(){

            var contentType = req.headers["content-type"]; // because may be client did not send content-type header so it's good to check in below if()
            if(contentType && contentType.startsWith("application/json")){ // because content-type can be "application/json; charset=utf-8" or "application/json; charset=ISO-8859-1" etc. so we are using startsWith() instead of ===
                try{
                    data = JSON.parse(data);
                    onSuccess(data);
                    return;
                }catch(e){
                    onFailure(e);
                }
            }
            else if(contentType && contentType.startsWith("application/x-www-form-urlencoded")){ // #3....
                var parsedData = new URLSearchParams(data); // #4.....
                parsedData = Object.fromEntries(parsedData);
                onSuccess(parsedData);
                return;
            }
            else
            {
                onSuccess(data);
            }
        })
    })
}



/*
#1....
So whats happening here is method parseBody() is supposed to return the processed body/payload.
When the execution started then req.on() registers a callback and that callback is not executing yet.
Then method parseBody() executes req.on() which again registers a callback and that callback is not executing yet  BUT that registered callback will return the processed request data/payload.
Then method parseBody() do not have left anything to execute so it will return.

So if someone was calling it to receive the data like this:
var payload  = parseBody(req);
then it will be undefined because parseBody() just returned.

so what happened with "return body;" statement?
That statement is inside the callback of req.on("end") and and will be invoked by node.js after completion of req.on("data")
and since no body is listening to that so that return statement will be discarded because it was not return statement of method parseBody().

PROMISE:
When a function (here it is parseBody) depends on result of an asynchronous operation that will complete later (here asynchronous operation is reading req body)
then it (parseBody()) should return a promise to it's caller (whoever is calling parseBody()) so that it's caller can wait for the result.
#2.........
Now the function parseBody() is returning a Promise Object in the 1st line itself.
Also js provides 2 functions to callback of Promise Object.
Until either onSuccess or onFailure is called inside the parseBody() the caller will keep waiting.
Here I am not using 'onFailure' but it can be used later.
The moment parseBody() is called, it immediately returns a Promise object. Later, when onSuccess(data) is called, the Promise is fulfilled with data. Any caller waiting using await or .then() then receives data as the result.

#3......
url encoded is just another format of encoding data to be sent over http like other data formats json and xml.
Http sends data and data formats like json, xml, url encoded are representation of that data.
url encoded data can be send :
Directly in url as query parameter like:
http://url.com/something?name=rahul&age=20   ==> here after'?' rest is url encoded data
Or in the body as payload like:
POST /something HTTP/1.1
Content-Type: application/x-www-form-urlencoded

name=rahul&age=20

Usually in a GET request it is send as query parameter in url because in general GET do not contains a body & in POST requests it is send in body section.

The equivalence url encoded of this json data:
{
    "name": "rahul",
    "age": 20
}
will be :
http://url.com/something?name=rahul&age=20.

There are some special characters meaning in url encoded forms like:
as we know there can't be a space in a url but if our data containing a space like lets say if name was"Rahul kumar" then it will be :
?name=rahul%20kumar&age=20

also characters like '=' and '&' have special meanings.
'=' => separates key and value.
'&' => separates key:value pairs
so if in the data these characters are present like:
"name": "Rahul & kumar"
then in url encoded form in url it will be:
?name=rahul%20%26%20kumar

#4.....
URLSearchParams is a class which parse the url encoded data into an object of type URLSearchParams. But this is not a normal js object.
Like if the url encoded was "name=Rahul%20kumar&age=30" then after doing:
var parsedData = new URLSearchParams(data);
To get the a value: parsedData.get("name"); // Rahul kumar
To update a value: parsedData.set("name", "Rohit kumar");
To add a property: parsedData.append("city", "NewYork");

But if you want the parsed result as a normal js object which you can access directly using it's properties (similar to result of JSON.parser()) then we will have to convert it into js Object like:
parsedData = Object.fromEntries(parsedData);
now it becomes as:
{
    name: "Rahul kumar",
    age: "30"
}
#5......
Actually here we are checking 2 things:
First before storing a single byte of payload we are checking if client has sent "content-length" and if yes then is it within the limit of MAX_BODY_SIZE. If not then immediately stop further processing.
Second, sometimes client can fake the "content-length" header and send a large payload so inside the req.on("data") we are calculating actual data received and the moment it exceeds the MAX_BODY_SIZE then we are stopping further processing.

*/