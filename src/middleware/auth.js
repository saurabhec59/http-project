import {verifyToken} from '../auth/token.js';
import {UnauthorizedError} from '../errors/UnauthorizedError.js';
import {ForbiddenError} from '../errors/ForbiddenError.js';

// How a typical Authorization looks like: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...

// This method is for JWT AUTHENTICATION
async function requireAuth(req, res, next){
    // jwtAuthentication() helper will return payload of jwt access token if jwt access token is verified successfully, otherwise it will return null
    const payload = jwtAuthentication(req);
    if(payload !== null){
        // means jwt access token is verified successfully, payload inserted in 'req.user' and we can call next() to pass control handler
        return await next(); //HERE next() IS NOT THE HANDLER ITSELF, IT IS A CALLBACK FUNCTION AND INSIDE THAT CALLBACK HANDLER IS CALLED WITH ARGS IT NEEDS, see server.js
    }
    else{
        // when jwt token is not verified then jwt.verify() will throw error and jwtAuthentication() will return null.
        // if 'Authorization' header is not present, header is present but scheme is not 'bearer', scheme is there but token is not there
        // In all cases this middleware should reject the request from further processing with error 401 unauthorized.
        throw new UnauthorizedError("User not authenticated");
    }
}

// This method is for JWT AUTHENTICATION + AUTHORIZATION
async function requireAdminAuth(req, res, next){
    // DOING AUTHENTICATION 1st, call jwtAuthentication() to verify jwt access token and get payload
    const payload = jwtAuthentication(req);
    if(payload !== null){
        // AUTHENTICATION DONE, means jwt access token is verified successfully, payload inserted in 'req.user' and we can call next() to pass control handler
        // Now check AUTHORIZATION, if user is admin or not.
        if(payload.role === "admin"){
            // user is admin, so call next() to pass control to handler
            return await next(); //HERE next() IS NOT THE HANDLER ITSELF, IT IS A CALLBACK FUNCTION AND INSIDE THAT CALLBACK HANDLER IS CALLED WITH ARGS IT NEEDS, see server.js
        }
        else{
            // AUTHORIZATION failed, user is not admin, so reject the request with 403 forbidden
            throw new ForbiddenError("User not authorized");
        }
    }
    else{
        // jwt token not verified means AUTHENTICATION failed, so reject the request with 401 unauthorized
        throw new UnauthorizedError("User not authenticated");
    }
}

// How a typical Authorization looks like: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
// This helper function will verify jwt access token. RETURN PAYLOAD on success or RETURN NULL on failure
function jwtAuthentication(req){
    if(req.headers.authorization){
        const splitAuthorization = req.headers.authorization.split(" ");
        //if 'Authorization' header is present then scheme should be 'Bearer' & there should be token as well
        // also convert scheme to lowercase because because node convert only Header names to lowercase not it's parameters
        if(splitAuthorization[0].trim().toLowerCase() === "bearer" && splitAuthorization.length === 2){
            // calling verifyToken() since scheme is 'bearer' and token is present
            //Also jwt.verify() inside verifyToken() will throw error if token is not verified/tempered so wrap this call in try-catch
            try{
                const payload = verifyToken(splitAuthorization[1].trim());
                //on succuss, jwt.verify() returns decoded payload of jwt token, we will insert that payload 'req' object so that handler can use it.
                req.user = payload; // {id: 3, role: ..., iat:..., iex...} <<<===============********
                return payload;
            }catch(e){
                return null; // unauthorized 401 will be send by caller of this helper itself
            }
        }
        else{
            return null; // unauthorized 401 will be send by caller of this helper itself
        }

    }
    else{
        return null; // unauthorized 401 will be send by caller of this helper itself
    }
}

export {requireAuth, requireAdminAuth};