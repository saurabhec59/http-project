import STATUS_CODES from './status-codes.js';

function badRequest(message){
    var errorMessage = {
        status: STATUS_CODES.BAD_REQUEST,
        error: "Bad Request",
        message: message
    }
    return errorMessage;
}

function unauthorized(message){
    var errorMessage = {
        status: STATUS_CODES.UNAUTHORIZED,
        error: "Unauthorized",
        message: message
    }
    return errorMessage;
}

function forbidden(message){
    var errorMessage = {
        status: STATUS_CODES.FORBIDDEN,
        error: "Forbidden",
        message: message
    }
    return errorMessage;
}

function notFound(message){
    var errorMessage = {
        status: STATUS_CODES.NOT_FOUND,
        error: "Not Found",
        message: message
    }
    return errorMessage;
}

function methodNotAllowed(message){
    var errorMessage = {
        status: STATUS_CODES.METHOD_NOT_ALLOWED,
        error: "Method Not Allowed",
        message: message
    }
    return errorMessage;
}

function requestTimeOut(message){
    var errorMessage = {
        status: STATUS_CODES.REQUEST_TIMEOUT,
        error: "Request Timeout",
        message: message
    }
    return errorMessage;
}

function payloadTooLarge(message){
    var errorMessage = {
        status: STATUS_CODES.PAYLOAD_TOO_LARGE,
        error: "Payload Too Large",
        message: message
    }
    return errorMessage;
}

function conflict(message){
    var errorMessage = {
        status: STATUS_CODES.CONFLICT,
        error: "Conflict",
        message: message
    }
    return errorMessage;
}

function unprocessableEntity(message){
    var errorMessage = {
        status: STATUS_CODES.UNPROCESSABLE_CONTENT,
        error: "Unprocessable Entity",
        message: message
    }
    return errorMessage;
}

function internalServerError(message){
    var errorMessage = {
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        error: "Internal Server Error",
        message: message
    }
    return errorMessage;
}

export { badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError };
/*
Problem:
Till now all request handlers like general.js, products.js, users.js are writing their own error messages like:

    if(!user){ // because getBYId() only loops through the array and if it does not find any user then it will
     not return anything and this variable 'user' will be undefined.
        var html = "<h2>User not found</h2>";
        responseBuilder.send404Response(res, html);
        return;
    }

But writing their own error messages are ok because errors are specific so each handler should produce their
own message but the problem is error responses are send a bit different.
Standard error responses contains a JSON body containing fields like:
status, error, message.
Here message is the specific message passed by handler.
But till now on the name of error response in the body we are just sending a html message. But it should be
a JSON object containing these fields.
Now Why field 'error' in the response JSON? while sending the response we always do "res.statusCode = ..."
then why in the body as well we are sending?
Reason is many logging systems, and clients finds it difficult to directly get the status code from response,
so if we put the entire error related info like 'status', 'error', 'message' in the response body then client
can easily find out complete info rather then collecting pieces so it's a good practice.
Any why only JSON response for errors? For consistency among clients because they can easily do error.status, error.message...

So in nutshell=> instead of sending a normal html error message by handler, now handlers will call these standard
error-response functions with their custom message as well => then these methods will return complete JSON object
containing all required info and then => handler will pass this returned object to response-builders or include in res.write()

*/