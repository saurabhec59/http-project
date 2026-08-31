import STATUS_CODES from '../utils/status-codes.js';
import crypto from 'crypto'; // a node.js built in module provides hashing functions.

// private helper — only used by sendJsonResponse. Not exported.
// ETag value must be wrapped in double-quote characters as per HTTP spec (RFC 7232).
function generateETag(body){
    return '"' + crypto.createHash('md5').update(body).digest('hex') + '"'; // other hashing methods/algo like sha1, sha256 as well.
}

const responseBuilder = {

    sendHtmlResponse: function(res, html){
        res.statusCode = STATUS_CODES.OK;
        res.setHeader("Content-Type", "text/html");
        res.write(html);
        res.end();
    },

    sendJsonResponse: function(req, res, statusCode, json){
        var body = JSON.stringify(json);
        const etag = generateETag(body);
        if(req.headers["if-none-match"] && req.headers["if-none-match"] === etag){
            res.statusCode = STATUS_CODES.NOT_MODIFIED;// 304 means response body is not modified since last time, so client can use it's cached response.
            res.setHeader("ETag", etag);// even if the response & ETag is not modified, we still should send the current ETag value.
            res.end();
            return;
        }
        res.statusCode = statusCode;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("ETag", etag);
        res.write(body);
        res.end();
    },

    sendAuthResponse: function(req, res, statusCode, json){
        res.statusCode = statusCode;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(json));
        res.end();
    },

    sendXmlResponse: function(res, xml){
        res.statusCode = STATUS_CODES.OK;
        res.setHeader("Content-Type", "application/xml");
        res.write(xml);
        res.end();
    },

    sendEmptyResponse: function(res){
        res.statusCode = STATUS_CODES.NO_CONTENT; // this code means url is correct but there is nothing to return as body/payload
        res.end();
    },

    sendRedirectResponse: function(res, url){
        res.statusCode = STATUS_CODES.FOUND; // 302 is to redirect to another url when requested resource has been moved temporarily to another url
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Location", url); // #4
        res.end();
    },

    sendTextFileDownloadResponse: function(res, text){  // #5... task was to send file data and ask client to download it
        res.statusCode = STATUS_CODES.OK;
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", "attachment; filename=\"myfile.txt\""); // filename attribute tells client that while saving use this name for the file. The weired syntax is js escaping.
        res.write(text);
        res.end();
    },

    sendErrorResponse: function(res, statusCode, message){
        res.statusCode = statusCode;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
        res.end();
    },

    sendStaticFileResponse: function(req, res, fileContent, mimeType, fileStats){ // #6...
        const etag = generateETag(fileContent);

        // ETag have more precision than .mtime also if both are present then ETag takes priority, that's why checking it first
        if(req.headers["if-none-match"] && req.headers["if-none-match"] === etag){
            res.statusCode = STATUS_CODES.NOT_MODIFIED;// 304 means response body is not modified since last time, so client can use it's cached response.
            res.setHeader("ETag", etag); // sending latest etag
            res.setHeader("last-modified", fileStats.mtime.toUTCString());// sending last modified time as well.
            res.end();
            return;
        }
        else if(req.headers["if-modified-since"]){
            //this request header contains time as string but we have to compare it against '.mime' which is a Date object, so converting client time into Date object as well.
            // Also I am aware that http request header "If-Modified-Since" have second precision means chances are .mtime contains time till milliseconds as well but http header will always contain till seconds, but not handelling that edge case here intentionally
            const clientTime = new Date(req.headers["if-modified-since"]);
            if(fileStats.mtime.getTime() === clientTime.getTime()){
                res.statusCode = STATUS_CODES.NOT_MODIFIED;
                res.setHeader("last-modified", fileStats.mtime.toUTCString());
                res.setHeader("ETag", etag)
                res.end();
                return;
            }
        }

        res.statusCode = STATUS_CODES.OK;
        res.setHeader("ETag", etag);
        res.setHeader("last-modified", fileStats.mtime.toUTCString());
        res.setHeader("content-type", mimeType);
        res.write(fileContent);
        res.end();
    }
}

export default responseBuilder;

/*/#4.......
      here the task was to redirect client to another url. So when client(browser) sees the response status code is 302 then it looks for "Location" header in response header.
      once it finds the "Location" header in response Header, it makes another same request but to url given in "Location". Also the body is optional here so there is not much sense of doing res.write().
      #5......
      server do not sends file to the client in response. Server reads the file data from disc or generates dynamically or fetches from another source and sends that data in response body/payload using methods like write(), end().
      Now lets see how client processes this response body/data/payload:
      It looks for response header "Content-Disposition: inline" or "Content-Disposition: attachment"
      if its value is "inline" means server wants data send in response body to be displayed, Then based on "Content-Type" client checks it's ability and does the same.
      but if value is "attachment" means server wants data send to be downloaded.
      ** if No "Content-Disposition" response header is provided by server then clients usually uses it's default ability to handle that content and usually it's "inline" means it will display it.
#5.....
ETag Header:
Usually a string generated by a hash function on response body on server side.
Suppose the server is sending a response with Header "Cache-Control: no-cache". It means client can cache this response but before using it, it must validate with server wheather this response is still valid or not.
but how client will validate with server?. Here comes the role of ETag header. So while sending the response, server sends header "ETag" as well which will contain mostly a hash value of that response body.
Now client will see the response header "Cache-Control: no-cache" and "ETag": "...." and it may cache the response with ETag value.
Now when client wants to use that cached response, it will make the request but it will add one more header "If-None-Match: etagvalue".
Before sending the response, server will check if the request contains header "If-None-Match" and if then it will calculate the latest hash value of that response body and compare it with the Etag value send by
client in "If-None-Match" header.
If ETag value send by client is same as latest generated by server then it means response body is not changed since last time and instead of sending the entire response body again,
server will send only status code 304 which means "Not Modified" and client will use it's cached response.
This way lot of bandwidth is saved.
***** Sending ETag header does not mean client will cache the response, it depends upon the "Cache-Control" header parameters and clients own preferences. But if it does then it will use ETag header to validate with server before using that cached response.

Now coming to our implementation,
It is better to calculate ETag value after building the entire response body in it's final form to maintain consistency and accuracy. That's why we are doing after JSON.stringify() of response body.
Most useful combination [ ETag + Cache-Control ] header.
"Cache-Control" is not advised to be used as generalized header for all responses like "ETag" because cache-controls depends upon the resources and their nature so better individual handlers take that decision.

#6.... "if-modified-since" request header:
Remember previously in our sendJsonResponse() we were calculating ETag and sending it in response header so that client can use it to validate if in case he wants to use cached response.
So there after seeing ETag in response client may cache the response and send "if-none-match" request header with stored ETag to validate with server and in our sendJsonResponse() we are doing it already.
But ETag is not the only way to validate cached response, we can use Last modified time of resource as well. So here while sending static file response we are sending one more header "last-modified" extracted from fileStats.mtime property.
Now after seeing this header just like ETag, client may cache the response and send "if-modified-since" request header as well to validate with server.
Here in the static file response we are sending both ETag and last-modified header so that client can use any one of them or even both to validate with server if he has cached response.
But Remember "ETag", "if-none-match" or "last-modified", "if-modified-since" are just validation headers, they do not control caching behavior. Caching behavior is controlled by "Cache-Control" header and client preferences.
*/
