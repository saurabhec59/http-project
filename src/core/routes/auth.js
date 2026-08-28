import {findCustomerByEmail, createCustomer, getCustomerById} from '../../repositories/customer-repo.js';
import {createCredentials, findCredentialsByCustomerId} from '../../repositories/customer-cred-repo.js';
import {createRefreshToken, findHashedRefreshToken, deleteRefreshToken} from '../../repositories/refresh-token-repo.js';
import {hashPassword, verifyPassword} from '../../auth/hash.js';
import {generateToken, generateRefreshToken} from '../../auth/token.js';
import STATUS_CODES from '../../utils/status-codes.js';
import responseBuilder from '../response-builder.js';
import {parseCookies} from '../../middleware/cookies.js';
import crypto from 'crypto';
import {BadRequestError} from '../../errors/BadRequestError.js';
import {UnauthorizedError} from '../../errors/UnauthorizedError.js';

async function loginCustomerHandler(req, res){
    // client will send email + password to login
    // we have verifyPassword() which takes entered password, & (salt & hashedPassword) of user with that id/email and returns true/false
    // 1st we will validate the body (email, entered password)  & this is not verifying password
    if(!validateCustomerLoginDetailsHandler(req)){
        throw new BadRequestError("Invalid customer details");
    }

    // check weather the user with email exists or not
    const existingCustomer = await findCustomerByEmail(req.body.email);
    if(!existingCustomer){
        // NOTE: Although we know email is incorrect but good practice is to send same error message for both email and password incorrect to avoid giving any hint to attacker about which one is incorrect.
        throw new UnauthorizedError("Email or password is incorrect"); // sending 401 instead of 404, READ the classic confusion of 401, 403 and it's names.
    }

    //now we can call our verifyPassword() but before calling it we need stored (salt & hashedPassword) of that user.
    // but in db that credential is stored along with 'id' not 'email' but above we have called findCustomerByEmail() which returned that customer.
    // finding salt & hashed password fot the user
    const customerCreds = await findCredentialsByCustomerId(existingCustomer.id);

    // checking weather credentials are found and returned by db, because if no credentials will be found with given 'id' then query method is returning null.
    if(customerCreds === null){
        throw new UnauthorizedError("Email or password is incorrect");
    }

    // passing args in same sequence verifyPassword() receives.
    const result = verifyPassword(req.body.password, customerCreds.password_salt, customerCreds.password_hash);

    if(result){
        // user entered correct email & password, Now we will generate jwt token and send in response body.(we can in header as well)
        // generate token with simple payload {"id": existingCustomer.id, role: existingCustomer.role}
        const jwtToken = generateToken({id: existingCustomer.id, role: existingCustomer.role}); // we can add more info in payload like email, name, age, city... but for now we will keep it simple with id and role.
        const refToken = generateRefreshToken();
        // generateRefreshToken() returns { refreshToken: refreshToken, hashedRefreshToken: hashedRefreshToken }, so we will store hashedRefreshToken in db and send refreshToken to client.
        // storing hashedRefreshToken in db
        const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);// 30 days from now
        await createRefreshToken(existingCustomer.id, refToken.hashedRefreshToken, refreshTokenExpiresAt); // createRefreshToken() takes 3 args (customer_id, hashedRefreshToken, expiresIn)
        //In a browser oriented application usually server sends refresh token in 'Set-Cookie' header as: below, so that browser can send automatically as 'Cookie' header.
        res.setHeader("Set-Cookie", "refresh_token=" + refToken.refreshToken + "; HttpOnly");
        const payload = {jwtToken: jwtToken};// so refresh token is sent in 'Set-Cookie' header and jwt access token is sent in response body as json.
        responseBuilder.sendAuthResponse(req, res, STATUS_CODES.OK, payload); // sending token in response body as json
        return;
    }
    // if verifyPassword() retuned false
    throw new UnauthorizedError("Email or password is incorrect");// client should not know 'email' was incorrect or 'password'. Thats why for both sending same 401 error response.
}

function validateCustomerLoginDetailsHandler(req){
    if(!(req.body && req.body.email && req.body.password)){
        return false;
    }
    if(typeof req.body.email !== "string" || typeof req.body.password !== "string"){
        return false;
    }
    // checking email and password length, will improve later
    if(req.body.email.trim().length < 8 || req.body.password.trim().length < 8){
        return false;
    }
    return true;
}

async function refreshTokenHandler(req, res){
    // a common approach for clients to send refresh token is in 'Cookie' header as 'refresh_token': .... with httpOnly... So we will also check there only
    const parsedCookie = parseCookies(req); // this is an existing parser in our middleware which returns {parameter: value}
    if(parsedCookie["refresh_token"]){
        // now hash the token received
        const hashedToken = crypto.createHash('sha-256').update(parsedCookie["refresh_token"]).digest('hex');
        // send this hashedToken to db search
        const result = await findHashedRefreshToken(hashedToken);
        if(result !== null){
            // means refresh token is correct and now we will check it's expiry time
            if(new Date() <= new Date(result.expires_at)){
                // menas exp is also valid & now we can generate new 'Access jwt token'
                // since after login when we are creating jwt token with payload 'id' & 'role' as well so we will do same here as well. .
                // Make db call getCustomerById(id) <<<<======== to get role of that customer as 'id' we already got from result.customer_id
                const customerDetails = await getCustomerById(result.customer_id);
                const jwtToken = generateToken({id: result.customer_id, role: customerDetails.role}); // generating new jwt access token with same payload as after login
                const payload = {jwtToken: jwtToken}; // sending in similar format as after login it is sent
                // sending response
                responseBuilder.sendAuthResponse(req, res, STATUS_CODES.OK, payload);
                return;
            }
            else{
                // token has expired, but still we will send 401
                throw new UnauthorizedError("User not authenticated");
            }
        }
        else{
            // refresh token not found
            throw new UnauthorizedError("User not authenticated");
        }
    }
    else{
        // no refresh-token present in cookie header so will send 401
        throw new UnauthorizedError("User not authenticated");
    }
}

async function logoutCustomerHandler(req, res){
    /*for now simply we have to delete the 'Refresh token' send by client.
    but still even after deleting the access_token, client still may have a valid jwt access token,
    that's why intentionally we keep exp of access tokens short.
    since access token technically can't be deleted,
    but there are still few little bit complex steps which invalidates a valid 'access token' but for now we will not go there.
    */

    const parsedCookie = parseCookies(req);
    if(parsedCookie["refresh_token"]){
        // means client has sent 'refresh_token', Now we will hash this 'refresh token' because db has hashed version
        const hashedToken = crypto.createHash('sha-256').update(parsedCookie["refresh_token"]).digest('hex'); // using same hash method used while creating it
        // Make db call to delete this token and we are doing this by token itself, not by id
        // because one customer_id can have multiple valid refresh_tokens means multiple devices login & we do not wants to  logout every device
        const result = await deleteRefreshToken(hashedToken);
        // deleteRefreshToken() is returning no of rows deleted, if it is 0 then also it's ok to send 200 & technically there is no use of this 'result' var but will keep it
        // sending response
        responseBuilder.sendAuthResponse(req, res, STATUS_CODES.OK, {message: "Logout successfully"});
        return;
    }
    else{
        // means there was no 'refresh_token' in the request at all so we will send 200 but it may be 401 as well in my opinion (Debatable)
        responseBuilder.sendAuthResponse(req, res, STATUS_CODES.OK, {message: "Logout successfully"});
        return;
    }
}

export { loginCustomerHandler, refreshTokenHandler, logoutCustomerHandler};

/*
Requirement is: // NOW THIS HAS BEEN MOVED TO customers.js FILE
    For the path:  POST /auth/register   ==> to create a new customer in db.
    User will enter details: email, name, age, city, password and will carry in request body.
    We have created table customers to store customer details with schema: customers(id, email, name, age, city) ==> where id is primary key and auto generated by psql.
    Also we have created another table customer_credentials to store credentials with schema: customer_credentials(customer_id, hashed_password, salt) ==> where customer_id is foreign key referencing customers(id).
        Also here hashed_password and salt are generated using hashPassword() function from auth/hash.js file. (Not storing passwords in plain text as it is in db)

    Registered handler: createCustomerHandler() is called when request is received.
    It will call validateCustomerDetailsHandler() to validate the request body.
    Then it will check if customer with same email already exists in db using findCustomerByEmail() method from customer-repo.js file.
    If incoming data was valid and customer do not exist then we will hash the password using hashPassword() method from auth/hash.js file.
    Then we will start transaction:
        inside the transaction we will create the customer and then store the credentials (hashed password and salt with customer_id) in db.
    If both operations (both queries) are successful then both changes (creating user and storing credentials) will be committed to db else both will be rolled back.
    Then this handler will send newly created customer data (not credentials) in response with 201.

*/