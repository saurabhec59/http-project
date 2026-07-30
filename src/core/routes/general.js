import responseBuilder from "../response-builder.js";

function homeHandler(req, res){
    res.statusCode = 200;var html = "<h2>Home page with html content</h2>";
    responseBuilder.sendHtmlResponse(res, html);
}

function htmlHandler(req, res){
    var html = "<h1>Hello html page</h1>";
    responseBuilder.sendHtmlResponse(res, html);
}

function jsonHandler(req, res){
    var json = {
        name: "Rahul",
        age: 30
    }
    responseBuilder.sendJsonResponse(res, json);
}

function xmlHandler(req, res){
    var xml = `
        <user>
            <name>Rahul</name>
            <age>30</age>
        </user>
    `;
    responseBuilder.sendXmlResponse(res, xml);
    // notice I have used backticks(``) instead of double quotes.Although using double quotes is also valid but Read about backticks benefits.
}

function debugRequestHandler(req, res){

    // creating js object
    const requestDetails = {
        method: req.method,
        url: req.url,
        httpVersion: req.httpVersion,
        headers: req.headers,
        rawHeaders: req.rawHeaders,
        IPOfClient: req.socket.remoteAddress,
        IPOfServer: req.socket.localAddress
    }

    responseBuilder.sendJsonResponse(res, requestDetails);
}

function emptyResponseHandler(req, res){
    responseBuilder.sendEmptyResponse(res);
}

function redirectToHomePageHandler(req, res){
    var urlToRedirect = "/";
    responseBuilder.sendRedirectResponse(res, urlToRedirect);
}

function downloadTextFileHandler(req, res){
    var text = "this is a fake text file";
    responseBuilder.sendTextFileDownloadResponse(res, text);
}

export {homeHandler, htmlHandler, jsonHandler, xmlHandler, debugRequestHandler, emptyResponseHandler, redirectToHomePageHandler, downloadTextFileHandler};