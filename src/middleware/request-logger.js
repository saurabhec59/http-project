import { info, warn, error, debug } from '../utils/logger.js';
import crypto from 'crypto'; //
function requestLogger(req, res){
    var reqId = crypto.randomUUID(); // this method generates a unique identifier(string) each time it is called.
    var shortRequestId = reqId.substring(0,8); // generated uuid is 36 chars long, so only for logging we will use this shortened version of it.
    req.requestId = reqId; // assigning unique requestId to each upcoming request.
    info(shortRequestId + " Request: " + req.method + " " + req.url); // logging request once it received.

    var startTime = performance.now(); // new Date(); or Date.now() can also be used but no need to create new 2 Date objects, performance.now() is more efficient and accurate.
    res.on("finish", function(){ // #1... Logging same response once it is sent(finished).
        var endTime = performance.now();
        var duration = (endTime - startTime).toFixed(2); // toFixed(2) will round the number to 2 decimal places.
        var message = shortRequestId + " Request completed: " + res.statusCode + " in " + duration + " ms";
        var statusCode = res.statusCode;
        if(statusCode >= 200 && statusCode < 300){ info(message); }
        else if(statusCode >= 300 && statusCode < 400){ warn(message); }
        else if(statusCode >=400 && statusCode <600){ error(message); }
    })
}

export { requestLogger };

/*
Requirement was to log request when it is received and also log when response is sent indicating the status code and response time.
So we created this middleware file with function requestLogger();
This is the 1st function which will be called when request is received. See the server.js file-> there this function is now called after receiving request.
Now this function:
Logs the request, it's method and url.
Then coming to #1...
res.on("finish", function(){..}) ====>
just like the event listener req.on("end", function(){..}) which is called when request is fully received,
res.on("finish", function(){..}) is another event listener which gets called when response headers and body is fully sent.
So to measure the response time we are getting time when request is received and when response is sent.
Then logging the status code and response time in ms.
...flow...till here..
once the request is coming in createServer() callback in server.js, we are calling this requestLogger().
here we are assigning a unique request id to each request as req.requestId = reqId;
for logging we are using shortened version of it. -> once response is finished ==> res.on("finish") ==> we are logging the request with it's logging id.

Also now the response end log color is based on status code, for request received log it is still info(message) call -> green but for response end it is kept with if else.
*/