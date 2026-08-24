import {findCustomerByEmail, createCustomer, getCustomerById, getAllCustomers, updateCustomer, deleteCustomer} from '../../repositories/customer-repo.js';
import {createCredentials, findCredentialsByCustomerId} from '../../repositories/customer-cred-repo.js';
import {hashPassword, verifyPassword} from '../../auth/hash.js';
import STATUS_CODES from '../../utils/status-codes.js';
import {badRequest, internalServerError, conflict, unauthorized, notFound} from '../../utils/error-responses.js';
import responseBuilder from '../response-builder.js';
import {withTransaction} from '../../db/transaction.js';

// NO AUTH REQUIRED
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

// for getting own details, REQUIRE AUTH
async function getCustomerMeHandler(req, res){
    // This requires auth and & if jwt access auth is successful then requireAuth() adds req.user = payload;
    // this is the payload of jwt access token like {id: ..., role: ..., exp: ..} & we can extract id from here as well.
    // ***** Using req.user.id so that customer can only get his own details, otherwise after successful jwt access token verification, using req.params.id will expose other customer details.
    const customer = await getCustomerById(req.user.id);
    if(customer === null){
        // means user with this id does not exist so send 404 not found
        var message = notFound("Resource not found");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.NOT_FOUND, message);
        return;
    }
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, customer);
    return;
}

// for admins to get any customer detail, REQUIRE AUTH, for now any logged in customer can get all customers but later we will implement admin one
async function getCustomerByIdHandler(req, res){
    // This requires auth and & if jwt access auth is successfull then requireAuth() adds req.user = payload;
    // this is the payload of jwt access token like {id: ..., role: ..., exp: ..} & we can extract id from here as well.
    // ***** This is admin route, and admin can get any customer by id, so we will use req.params.id extracted and inserted by mathRoute() here instead of req.user.id ******
    // currently requireAuth() do not have any admin check, so till that is not implemented this should not be used.
    const customer = await getCustomerById(req.params.id); // we can use req.params.id as well because matchRoute() parses params (:)  as well.
    if(customer === null){
        // means user with this id does not exist so send 404 not found
        var message = notFound("Resource not found");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.NOT_FOUND, message);
        return;
    }
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, customer);
    return;
}

// for admins, REQUIRE AUTH, for now any logged in customer can get all customers but later we will implement admin one
async function getAllCustomersHandler(req, res){
    const customers = await getAllCustomers();
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, customers);
}

// REQUIRE AUTH
async function updateCustomerMeHandler(req, res){
    if((!validateUpdateCustomerDetails(req))){// id in jwt should match with requested 'id' in body to be updated becuase it's not admin request
        var message = badRequest("Invalid customer details");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, message);
        return;
    }
    // USING req.user.id BECAUSE it's a self update request , Also sequence should be id, email, name, age, city in argument
    const result = await updateCustomer(req.user.id, req.body.email, req.body.name, req.body.age, req.body.city);
    // in case customer did not exist, result will be null, so we will send 404 not found
    if(result === null){
         var message = notFound("Resource not found");
         responseBuilder.sendErrorResponse(res, STATUS_CODES.NOT_FOUND, message);
         return;
    }
    // returning returned updated row/customer
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, result);
}

// FOR admins, REQUIRE AUTH, for now any logged in customer can get all customers but later we will implement admin one
async function updateCustomerHandler(req, res){
    if((!validateUpdateCustomerDetails(req))){// id in body should match with requested 'id' in body to be updated because it's not admin request
        var message = badRequest("Invalid customer details");
        responseBuilder.sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, message);
        return;
    }
    // USING req.params.id BECAUSE admin can update any customer , Also sequence should be id, email, name, age, city in argument
    const result = await updateCustomer(req.params.id, req.body.email, req.body.name, req.body.age, req.body.city);
    // in case customer did not exist, result will be null, so we will send 404 not found
    if(result === null){
         var message = notFound("Resource not found");
         responseBuilder.sendErrorResponse(res, STATUS_CODES.NOT_FOUND, message);
         return;
    }
    // returning returned updated row/customer
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, result);
}

// REQUIRE AUTH
async function deleteCustomerMeHandler(req, res){
    // FOR NOW EVEN IF customer does not exist and db returns rows.count as 0 then also we are sending 204 no content because final state what client demanded is same in both cases
    // weather customer was there and deleted or customer did not exist  but I would love to have reviewer comments on it.
    const result = await deleteCustomer(req.user.id); // using jwt's req.user.id because this is self delete request
    res.statusCode = STATUS_CODES.NO_CONTENT; // usually 204 no content is send after successful deleteion without a body/payload
    res.end();
}

// FOR admins, REQUIRE AUTH
async function deleteCustomerHandler(req, res){
    const result = await deleteCustomer(req.params.id); // using req.params.id because admin can delete any account
    res.statusCode = STATUS_CODES.NO_CONTENT; // usually 204 no content is send after successful deleteion without a body/payload
    res.end();
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

function validateUpdateCustomerDetails(req){
    // checking if all required fields are present,to update needed fields are id, email, name, age, city
    if(!(req.body && req.body.email && req.body.name && req.body.age && req.body.city)){
        return false;
    }
    // checking if all fields are of correct type // FOR EMAIL WE NEED strong check that we will implement later.
    if(typeof req.body.email !== "string" || typeof req.body.name !== "string" || typeof req.body.age !== "number" || typeof req.body.city !== "string"){
        return false;
    }
    // checking email length
    if(req.body.email.trim().length < 8){
        return false;
    }
    return true;
}

export {createCustomerHandler, getCustomerMeHandler, getCustomerByIdHandler, getAllCustomersHandler, updateCustomerMeHandler, updateCustomerHandler, deleteCustomerMeHandler, deleteCustomerHandler};