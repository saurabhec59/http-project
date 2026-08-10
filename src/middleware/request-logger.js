import { info, warn, error, debug } from '../utils/logger.js';
function requestLogger(req, res){
    info("Request: " + req.method + " " + req.url); // logging request once it received.

    var startTime = performance.now(); // new Date(); or Date.now() can also be used but no need to create new 2 Date objects, performance.now() is more efficient and accurate.
    res.on("finish", function(){ // #1... Logging same response once it is sent(finished).
        var endTime = performance.now();
        var duration = (endTime - startTime).toFixed(2); // toFixed(2) will round the number to 2 decimal places.
        info("Request completed with status code: " + res.statusCode + " in " + duration + " ms");
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
*/