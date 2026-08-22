import STATUS_CODES from '../utils/status-codes.js';
import responseBuilder from '../core/response-builder.js';
import { badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError, unsupportedMediaType } from '../utils/error-responses.js';

function errorHandler(err, req, res){
    // parseBody() attaches a statusCode to each error so we know exactly which HTTP response to send.
    if(err.statusCode === STATUS_CODES.REQUEST_TIMEOUT){//408
        var message = requestTimeOut(err.message);
        responseBuilder.sendErrorResponse(res, STATUS_CODES.REQUEST_TIMEOUT, message);
    } else if(err.statusCode === STATUS_CODES.PAYLOAD_TOO_LARGE){ //413
        var message = payloadTooLarge(err.message);
        responseBuilder.sendErrorResponse(res, STATUS_CODES.PAYLOAD_TOO_LARGE, message);
    } else if(err.statusCode === STATUS_CODES.UNSUPPORTED_MEDIA_TYPE){ //415
        var message = unsupportedMediaType(err.message);
        responseBuilder.sendErrorResponse(res, STATUS_CODES.UNSUPPORTED_MEDIA_TYPE, message);
    }
    else {
        var message = badRequest(err.message);
        responseBuilder.sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, message);//400
    }
    return;
}

export { errorHandler };