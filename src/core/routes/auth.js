import {findCustomerByEmail, createCustomer} from '../../repositories/customer-repo.js';
import {createCredentials, findCredentialsByCustomerId} from '../../repositories/customer-cred-repo.js';
import {hashPassword, verifyPassword} from '../../auth/hash.js';
import STATUS_CODES from '../../utils/status-codes.js';
import {badRequest, internalServerError, conflict, unauthorized} from '../../utils/error-responses.js';
import responseBuilder from '../response-builder.js';
import {withTransaction} from '../../db/transaction.js';

async function createCustomerHandler(req, res){
    if(!validateCustomerDetailsHandler(req)){
        // validation failed, sending 400
        var message = badRequest("Invalid customer details");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, message);
        return;
    }

    // check if user with same email already exists
    const existingCustomer = await findCustomerByEmail(req.body.email);
    if(existingCustomer !== null){
        // user with same email already exists, send 409 Conflict response
        var message = conflict("Customer with email " + req.body.email + " already exists");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.CONFLICT, message);
        return;
    }

    // hashing password
    const hashedObject = hashPassword(req.body.password);

    // using transaction, wrapping in try-catch to handle any errors during transaction // <===> ALSO FOLLOW HOW RETURN IS HAPPENING FROM createCustomer() -> withTransaction() -> its's callback -> then how finally response is being sent
    var createdCustomer;
    try{
         createdCustomer = await withTransaction(async function(client){
            // now calling createCustomer() to create new customer in database
            const newCustomer = await createCustomer(client, req.body.email, req.body.name, req.body.age, req.body.city);
            // storing credentials in db
            await createCredentials(client, newCustomer.id, hashedObject.hashedPassword, hashedObject.salt);
            return newCustomer;
        })
    }catch(e){
        var message = internalServerError("Internal server error");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, message);
        return;
    }

    // we will return here the response using response builder
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.CREATED, createdCustomer);

}

function validateCustomerDetailsHandler(req){
    // checking if all required fields are present
    if(!(req.body && req.body.email && req.body.name && req.body.age && req.body.city && req.body.password)){
        return false;
    }
    // checking if all fields are of correct type
    if(typeof req.body.email !== "string" || typeof req.body.name !== "string" || typeof req.body.age !== "number" || typeof req.body.city !== "string" || typeof req.body.password !== "string"){
        return false;
    }
    // checking email and password length
    if(req.body.email.trim().length < 8 || req.body.password.trim().length < 8){
        return false;
    }
    return true;
}

async function loginCustomerHandler(req, res){
    // client will send email + password to login
    // we have verifyPassword() which takes entered password, & (salt & hashedPassword) of user with that id/email and returns true/false
    // 1st we will validate the body (email, entered password)  & this is not verifying password
    if(!validateCustomerLoginDetailsHandler(req)){
        var message = badRequest("Invalid customer details");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, message);
        return;
    }

    // check weather the user with email exists or not
    const existingCustomer = await findCustomerByEmail(req.body.email);
    if(!existingCustomer){
        // NOTE: Although we know email is incorrect but good practice is to send same error message for both email and password incorrect to avoid giving any hint to attacker about which one is incorrect.
        var message = unauthorized("Email or password is incorrect"); // sending 401 instead of 404, READ the classic confusion of 401, 403 and it's names.
        responseBuilder.sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, message);
        return;
    }

    //now we can call our verifyPassword() but before calling it we need stored (salt & hashedPassword) of that user.
    // but in db that credential is stored along with 'id' not 'email' but above we have called findCustomerByEmail() which returned that customer.
    // finding salt & hashed password fot the user
    const customerCreds = await findCredentialsByCustomerId(existingCustomer.id);

    // checking wether credentials are found and returned by db, because if no credentials will be found with given 'id' then query method is returning null.
    if(customerCreds === null){
        var message = unauthorized("Email or password is incorrect");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, message);
        return;
    }

    // passing args in same sequence verifyPassword() receives.
    const result = verifyPassword(req.body.password, customerCreds.password_salt, customerCreds.password_hash);

    if(result){
        // user entered correct email & password, we will create standard response-builder method for it later and and increment jwt creation as well but for now taking one step at a time.
        res.statusCode = STATUS_CODES.OK; // sending 200
        res.end();
        return;
    }
    // if verifyPassword() retuned false
    var message = unauthorized("Email or password is incorrect");
    responseBuilder.sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, message);// client should not know 'email' was incorrect or 'password'. Thats why for both sending same 401 error response.
    return;
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

export {createCustomerHandler, loginCustomerHandler};

/*
Requirement is:
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