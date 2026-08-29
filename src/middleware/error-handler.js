import { BaseError } from '../errors/BaseError.js';
import responseBuilder from '../core/response-builder.js';
import STATUS_CODES from '../utils/status-codes.js';
import { error as logError } from '../utils/logger.js';// doing alias because we have 'error' as parameter in the function below.

function errorHandler(error, req, res) {

    if (error instanceof BaseError) {
        logError(req.requestId + " " + error.name + ": " + error.message);// This method is from logger.js , log the error with details(not sensitive details).
        const response = {
            error: {
                message: error.message,
                statusCode: error.statusCode,
                details: error.details
            }
        };
        responseBuilder.sendErrorResponse(res, error.statusCode, response);
        return;
    }

    // Any error that we don't recognize is an unexpected internal error, but we will log that as well on server side.
    // also we are logging only at server side, not sending any sensitive details to client, just sending generic message to client.
    // error.stack ==> a property of 'Error' class --> this will give details like in which file, function and line number the error occurred, this is very useful for debugging.
    logError(req.requestId + " Unexpected error: " + error.message + "\n" + error.stack); // This method is from logger.js , log the error with details(not sensitive details).

    const response = {
        error: {
            message: "Internal server error",
            statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
            details: null
        }
    };
    responseBuilder.sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, response);
}

export { errorHandler };