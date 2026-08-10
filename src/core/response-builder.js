import STATUS_CODES from '../utils/status-codes.js';
const responseBuilder = {

    sendTextResponse: function(res, text){
        res.statusCode = STATUS_CODES.OK;
        res.setHeader("Content-Type", "text/plain");
        res.write(text);
        res.end();
    },

    sendHtmlResponse: function(res, html){
        res.statusCode = STATUS_CODES.OK;
        res.setHeader("Content-Type", "text/html");
        res.write(html);
        res.end();
    },

    sendJsonResponse: function(req, res, statusCode, json){
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

    send400Response: function(res, message){
        res.statusCode = STATUS_CODES.BAD_REQUEST;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
        res.end();
    },

    send404Response: function(res, message){
        res.statusCode = STATUS_CODES.NOT_FOUND;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
        res.end();
    },

    send405Response: function(res, message){
        res.statusCode = STATUS_CODES.METHOD_NOT_ALLOWED;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
        res.end();
    },

    send408Response: function(res, message){
        res.statusCode = STATUS_CODES.REQUEST_TIMEOUT;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
        res.end();
    },

    send413Response: function(res, message){
        res.statusCode = STATUS_CODES.PAYLOAD_TOO_LARGE;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
        res.end();
    },

    send415Response: function(res, message){
        res.statusCode = STATUS_CODES.UNSUPPORTED_MEDIA_TYPE;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
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
*/
