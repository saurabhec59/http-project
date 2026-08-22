import {verifyToken} from '../auth/token.js';
import {unauthorized} from '../utils/error-responses.js';
import STATUS_CODES from '../utils/status-codes.js';
import responseBuilder from '../core/response-builder.js';

// How a typical Authorization looks like: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...

// if 'Authorization' header is not present, header is present but scheme is not 'bearer', scheme is there but token is not there
// In all cases this middleware should reject the request from further processing with error 401 unautorized.
function requireAuth(req, res, next){
    if(req.headers.authorization){
        const splitAuthorization = req.headers.authorization.split(" ");
        //if 'Authorization' header is present then scheme should be 'Bearer' & there should be token as well
        // also convert scheme to lowercase because because node convert only Header names to lowercase not it's parameters
        if(splitAuthorization[0].trim().toLowerCase() === "bearer" && splitAuthorization.length === 2){
            // calling verifyToken() since scheme is 'bearer' and token is present
            //Also jwt.verify() inside verifyToken() will thow error if token is not verified/tempered so wrap this call in try-catch
            try{
                const payload = verifyToken(splitAuthorization[1].trim());
                //on succus, jwt.verify() returns decoded payload of jwt token, we will insert that payload 'req' object so that handler can use it.
                req.user = payload; // {id: 3, iat:..., iex...}
                next(); //HERE next() IS NOT THE HANDLER ITSELF, IT IS A CALLBACK FUNCTION AND INSIDE THAT CALLBACK HANDLER IS CALLED WITH ARGS IT NEEDS, see server.js
            }catch(e){
                var message = unauthorized("User not authenticated");
                responseBuilder.sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, message)
                return;
            }
        }
        else{
            var message = unauthorized("User not authenticated");
            responseBuilder.sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, message)
            return;
        }

    }
    else{
        var message = unauthorized("User not authenticated");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, message)
        return;
    }
}

export {requireAuth};