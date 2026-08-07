import responseBuilder from "../response-builder.js";
import STATUS_CODES from "../../utils/status-codes.js";
import {badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError } from '../../utils/error-responses.js';

function homeHandler(req, res){
    var html = "<h2>Home page with html content</h2>";
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

function urlNotFoundHandler(req, res){
    var html = "<h2>Mind your url</h2>";
    responseBuilder.send404Response(res, html);
}

function methodNotAllowedHandler(req, res){
    var html = "<h2>Mind your method</h2>";
    responseBuilder.send405Response(res, html);
}

function echoParsedBodyHandler(req, res){ // #1....
    var requestType = req.headers["content-type"];
    res.statusCode = STATUS_CODES.OK;
    if(requestType.startsWith("application/json") || requestType.startsWith("application/x-www-form-urlencoded")){
        res.setHeader("Content-Type", requestType);
        res.write(JSON.stringify(req.body));
        res.end();
    }
    else{
        res.setHeader("Content-Type", requestType);
        res.write(req.body);
        res.end();
    }
}

export {homeHandler, htmlHandler, jsonHandler, xmlHandler, debugRequestHandler, emptyResponseHandler, redirectToHomePageHandler, downloadTextFileHandler, urlNotFoundHandler, methodNotAllowedHandler, echoParsedBodyHandler};

/*
#1...
this task was to return the PROCESSED body content back to client. Since we were parsing only json and url encoded payloads and the parsed results were of object type so
simply returning that object back to client as json is enough. And for other type of incoming payloads we are simply storing them as string as you can see in body-parser.js
so in else condition we simply returned that string back because res.write() accepts string as well.
*/