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
import { XMLParser } from "fast-xml-parser";
const xmlParser = new XMLParser(); // we do not want to create new instance of XMLParser for each request so we are creating it once and reusing it for all requests.
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

        // #9....  Setting time out if client did not sent bytes/payload after connection
        var timeout = setTimeout(function(){
            var error = new Error("Request timed out"); // #10....
            error.statusCode = 408; // 408 REQUEST_TIMEOUT
            onFailure(error);
            req.resume(); // #11...

        }, 30000);
        // preventing server from processing large malicious or fake requests ===>  #5......
        if(req.headers["content-length"] && parseInt(req.headers["content-length"]) > MAX_BODY_SIZE){
            var error = new Error("Request body too large");
            error.statusCode = 413; // PAYLOAD_TOO_LARGE
            clearTimeout(timeout); // cancel the timer so it doesn't fire again after we already rejected
            onFailure(error);
            return;
            /*
                it's not always guaranteed that each request with a body/payload will have header "Content-Length" but as for a preventive measure we can check that if client has sent that header
                then we can reject the request and further processing .
            */
        }

        var data = "";
        var chunkSize = 0;
        const encodingType = findCharacterEncoding(req); // we do not want to call this function for each chunk received inside req.on("data") because for one request encoding type will be same for all chunks.
        req.on("data", function(chunk){

            timeout = resetTimeout(); // resetting the timeout for each chunk received because if client is sending data in chunks then we should not destroy the request until all chunks are received. So we are resetting the timeout for each chunk received.
            // although we are already checking content-length header size above but still client can fake that header and send large payload so we are checking the actual size of data received here.
            chunkSize += chunk.length;
            if(chunkSize > MAX_BODY_SIZE){
                var error = new Error("Request body too large");
                error.statusCode = 413; // PAYLOAD_TOO_LARGE
                clearTimeout(timeout); // cancel the timer so it doesn't fire again after we already rejected
                onFailure(error);
                req.resume();
                return;
            }

            // #8........
            if(encodingType){// if encodingType is undefined means client did not send "charset" parameter and fall back to default Node.js encoding
                if(Buffer.isEncoding(encodingType)){
                    // Buffer.isEncoding() returns true if the given encoding is supported by Node.js. Also Buffer.isEncoding() is case-insensitive so it will return true for "utf-8" and "UTF-8" both.
                    data += chunk.toString(encodingType);
                }
                else{
                    // if encodingType is not supported by Node.js then we can not process the request body and we should reject the request.
                    var error = new Error("Unsupported character encoding: " + encodingType);
                    error.statusCode = 415; // UNSUPPORTED_MEDIA_TYPE
                    clearTimeout(timeout); // cancel the timer so it doesn't fire again after we already rejected
                    onFailure(error);
                    req.resume();
                    return;
                }
            }else{
                data += chunk.toString(); // default encoding is utf-8
            }
            /*
            data += chunk;
            */
        })

        req.on("end", function(){

            clearTimeout(timeout);

            var contentType = req.headers["content-type"]; // because may be client did not send content-type header so it's good to check in below if()
            if(contentType && contentType.startsWith("application/json")){ // because content-type can be "application/json; charset=utf-8" or "application/json; charset=ISO-8859-1" etc. so we are using startsWith() instead of ===
                try{
                    data = JSON.parse(data);
                    onSuccess(data);
                    return;
                }catch(e){
                    e.statusCode = 400; // BAD_REQUEST
                    onFailure(e);
                }
            }
            else if(contentType && contentType.startsWith("application/x-www-form-urlencoded")){ // #3....
                var parsedData = new URLSearchParams(data); // #4.....
                parsedData = Object.fromEntries(parsedData);
                onSuccess(parsedData);
                return;
            }
            // #6...... NOTE: I am aware that this is not a complete and fully correct implementation of multipart/form-data parsing, I tried understanding basics of it.
            else if(contentType && contentType.startsWith("multipart/form-data")){
                var parsedData = {};
                // extracting the boundary parameter, clients adds 2 extra hyphens in body that's why we are adding as well.
                var boundary  = "--" + req.headers["content-type"].split("boundary=")[1];
                var fields = data.split(boundary); // #7......
                for(var i = 1; i<fields.length; i++){
                    var field = fields[i].split("\r\n\r\n");
                    // trying to get name parameter
                    var fieldName = field[0].split("name=")[1];// i suspect it will be "name" instead of name;
                    // trying to get the actual data
                    var rawData = field[1].trim(); // to remove the \r\n included
                    parsedData[fieldName] = rawData;
                }
                onSuccess(parsedData);
                return;
            }
            else if(contentType && contentType.startsWith("application/xml")){
                // node.js do not have built-in xml parser so we are using 3rd party library "fast-xml-parser" to parse xml data.
                try{
                    var parsedData = xmlParser.parse(data);
                    onSuccess(parsedData);
                    return;
                }catch(e){
                    e.statusCode = 400; // BAD_REQUEST
                    onFailure(e);
                }
            }
            else
            {
                onSuccess(data);
            }
        })

        function resetTimeout(){
            clearTimeout(timeout);
            return setTimeout(function(){
                var error = new Error("Request timed out");
                error.statusCode = 408; // 408 REQUEST_TIMEOUT
                onFailure(error);
                req.resume();
            }, 30000);
        }
    })
}

// addition this function as utility
function findCharacterEncoding(req){
    var contentType = req.headers["content-type"];
    var encodingType;

    if(contentType){
        var parameters = contentType.split(";");
        for(var i = 1; i<parameters.length; i++){
            if(parameters[i].trim().startsWith("charset")){
                encodingType = parameters[i].split("=")[1].trim();
            }
        }
    }

    return encodingType;
}

export { parseBody };


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

#6.....
lets understand multipart/form-data format 1st.
The header looks like : Content-Type: multipart/form-data; boundary=ABC123
Notice there is one extra parameter called "boundary". But why? Imagine there is a form sending 'name', 'age' and a text file. So the request body will contain all 3 data. Http knows nothing about formate of data, for it
everything is byte and it sends that byte over the wire as it is. But now server needs to know that in the request payload/body where data of 'name' ends, where data of 'age' starts and ends....
so server needs to know how to separate the data of each field. That is why client sends a boundary parameter in the header which is a unique string and also client puts that unique string in the request body in between the data of each field.
So that server can separate using same parameter/boundary as well.
Lets say we have a form which sends data including 2 fields 'name' and 'age' and a text file. Then the request body containing that payload will look like:

--ABC123
Content-Disposition: form-data; name="name"

John
--ABC123
Content-Disposition: form-data; name="age"

25
--ABC123--

===> Now notice boundary value is "ABC123" but while inserting in request body, client is adding 2 extra hyphens "--" before boundary value and also after the last field it is adding 2 extra hyphens "--" after boundary value.
So server should also take care of that while parsing.
==> Also notice the request body is different then url encoded or json formates where usually only data is sent in request body but here some metadata headers are also sent.
That's why parsing multipart/form-data is more complex than other formats. Usually pre-built libraries are used. But we are trying a basic implementation of it to get some feel.

#7..... BASED ON ABOVE BODY EXAMPLE,
after var fields = data.split(boundary);
fields[0] ==> ""  (empty string)
fields[1] ==> "\r\nContent-Disposition: form-data; name="name"\r\n\r\nJohn\r\n"   ========> "\r\n" means new line.
fields[2] ==> "\r\nContent-Disposition: form-data; name="age"\r\n\r\n25\r\n"
fields[3] ==> "--"  (because of the last boundary with 2 extra hyphens)

now inside the for loop after this line: var field = fields[i].split("\r\n\r\n");
field[0] ==> "Content-Disposition: form-data; name="name""
field[1] ==> "John\r\n"  (notice the new line at the end)

#8........
Weather it a text like: " this is me"
or html : <h2>"this is html"</h2>
or json : {
    "name": "Rahul", "age": 30
}
or xml

But these are just collection of characters like alphabets, numbers and special characters like '<', '{', '}', space, next line '\n'.
Everything is just characters and special characters.
Each character and special character(@, #, %, space, tab, newline...) have an equivalent numeric value representation like 'A' -> 65..
But but but...
Which character will be converted into what numerical value depends upon the encoding type.
There are many encoding types like ASCII, UTF-8, UTF-16... and they are nothing just defining numerical representation of characters.
so when computer processes them then it convert each character into ints numerical representation BASED ON ENCODING TYPE USED.
Then each numerical number gets converted into it's binary representation.as binary(like 01010101 10101110).
Here it is bits(0's and 1's) but collectively 8 bits called bytes.
Then these bytes(binary) gets stored in disk or storage or transmitted over network.
So when we say http did not care about payload/body format then it means it actually did not. Everything transmitting over network in a http protocol inside the req or res body is just bytes(binary).
It's responsibility of application/server to convert these received bytes into characters using a character encoding and into correct formates.

Now coming at our server side:
When we say 'chunk' inside the req.on("data") is a buffer means 'chunk' is having raw bytes like 01010101 11001100....
Node.js uses default encoding UTF-8 to decode those bytes into characters and then these characters gets concatenated to string variable 'data' as shown : data += chunk;
But when client sends the character encoding along with the payload then server should decode those raw bytes using that encoding.
Usually clients sends like:
Content-Type: application/json; charset = utf-8
Content-Type: application/xml; charset = utf-16

#9.....
lets understand what's need is. We want when a client sent a request with methods like: POST, PUT, PATCH then from createServer() of the server.js this body-parser method is called to parse the body/payload..
Now what if client is not sending the payload/data after the connection is established? Then our Promise of bodyParse() will never resolve and keep waiting forever because req.on("data") will never be called and that's why req.on("end") will never be called.
So the timeout is required to destroy the request to save the server resources.
Solution is:
we will set time out at 2 places.
1st inside the Promise and before the req.on("data"); ===> because it is possible that client did not sent a byte/data after connecting.
2nd inside the req.on("data"); ===> because may be client is taking too long to send the bytes in-between, as we know for each chunk received the req.on("data") is called.
Now lets look at setTimeout(callbackFunction(), time)   ===> 2nd arg is time in milisecond, 1st arg is a callback function which gets executed after timer is up.

What is resetTimeout() ==> It is just a helper function which is called inside req.on("data").
It does clearTimeout(timeout); ==> clearTimeout() kills the timer means here when we receive the chunk, kill the timer referenced via variable 'timeout'.
Next its returning a new setTimeout() instance which is getting stored in reference 'timeout' but why? because once clearTimeout() executes then it kills the timer and there is no way to restart that timer or reset so we pass a new timer instance  to var 'timeout'
In Nutshell,
Actually we are not creating 2 timers, We start one timeout before waiting for the first chunk. Every time a new chunk arrives, we cancel the previous timer and start a fresh one.

# 10....
Understand how many errors our current implementation of parseBody() is throwing..
1st -> Timeout -> which is 408 REQUEST_TIMEOUT
2nd -> Request body too large -> which is 413 PAYLOAD_TOO_LARGE
3rd -> Unsupported character encoding -> which is 415 UNSUPPORTED_MEDIA_TYPE
4th -> JSON.parse() error -> while parsing content-type = "application/json" -> which is 400 BAD_REQUEST
5th -> XML parsing error -> while parsing content-type = "application/xml" -> which is again 400 BAD_REQUEST

But in server.js while calling parseBody() we were doing  => responseBuilder.send400Response(res, message);
Means for each error send by Promise of parseBody() was treated as 400 BAD_REQUEST.

That's why we are updating the parseBody(), now before throwing the error we will add a property 'statusCode' to that error object so that when server.js receives that error so based on it's statusCode it can call the specific responseBuilder method
instead of always calling send400Response().

#11....
onFailure() is a callback function of Promise, so it did not run the catch block in server.js immediately.
So when we do :
onFailure(error);
req.destroy();

Here req.destroy() gets executed immediately, so there is high chance that before catch block in server.js gets executed, the req.destroy() will destroy the entire socket connection, so there is no connection open to send the error response
from catch block And client will get empty response instead of server error response.
So the better choice is to do ==> req.resume(); which will discard the upcoming data and node will not receive further data from client but the connection will remain open,
later the res.end() statement inside the responseBuilder methods will close the connection.
*/