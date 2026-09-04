import {findCustomerByEmail, createCustomer, getCustomerById, getAllCustomers, updateCustomer, deleteCustomer, getAllCustomersCount} from '../../repositories/customer-repo.js';
import {createCredentials, findCredentialsByCustomerId} from '../../repositories/customer-cred-repo.js';
import {hashPassword, verifyPassword} from '../../auth/hash.js';
import STATUS_CODES from '../../utils/status-codes.js';
import responseBuilder from '../response-builder.js';
import {withTransaction} from '../../db/transaction.js';
import {BadRequestError} from '../../errors/BadRequestError.js';
import {ConflictError} from '../../errors/ConflictError.js';
import {NotFoundError} from '../../errors/NotFoundError.js';
import {validateUpdateCustomerDetails, validateCustomerDetailsHandler} from '../../utils/validators.js';

// NO AUTH REQUIRED
async function createCustomerHandler(req, res){
    if(!validateCustomerDetailsHandler(req)){
        // validation failed, sending 400
        throw new BadRequestError("Invalid customer details");
    }

    // check if user with same email already exists
    const existingCustomer = await findCustomerByEmail(req.body.email);
    if(existingCustomer !== null){
        // user with same email already exists, send 409 Conflict response
        throw new ConflictError("Customer with email " + req.body.email + " already exists");
    }

    // hashing password
    const hashedObject = hashPassword(req.body.password);

    // using transaction, wrapping in try-catch to handle any errors during transaction // <===> ALSO FOLLOW HOW RETURN IS HAPPENING FROM createCustomer() -> withTransaction() -> its's callback -> then how finally response is being sent
    const createdCustomer = await withTransaction(async function(client){
        const newCustomer = await createCustomer(req.body.email, req.body.name, req.body.age, req.body.city, client);
        await createCredentials(newCustomer.id, hashedObject.hashedPassword, hashedObject.salt, client);
        return newCustomer;
    });

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
        throw new NotFoundError("Resource not found");
    }
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, customer);
    return;
}

// for admins to get any customer detail, REQUIRE ADMIN AUTH
async function getCustomerByIdHandler(req, res){
    // This requires auth and & if jwt access auth is successfull then requireAuth() adds req.user = payload;
    // this is the payload of jwt access token like {id: ..., role: ..., exp: ..} & we can extract id from here as well.
    // ***** This is admin route, and admin can get any customer by id, so we will use req.params.id extracted and inserted by mathRoute() here instead of req.user.id ******
    // currently requireAuth() do not have any admin check, so till that is not implemented this should not be used.
    const customer = await getCustomerById(req.params.id); // we can use req.params.id as well because matchRoute() parses params (:)  as well.
    if(customer === null){
        // means user with this id does not exist so send 404 not found
        throw new NotFoundError("Resource not found");
    }
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, customer);
    return;
}

// for admins, REQUIRE ADMIN AUTH
async function getAllCustomersHandler(req, res){
    refineQueryParams(req);
    var sort = req.query.sorting.sort;
    var order = req.query.sorting.order;
    var limit = req.query.pagination.limit;
    var offset = (req.query.pagination.page -1) * limit; // in psql, there is not page concept, so we use offset which means skip first 'offset' number of rows
    // if limit passed is more than total rows in db then psql will return available rows only
    // if offset passed is more than total rows in db then psql will return empty array, so we don't need to handle that case here.
    const customers = await getAllCustomers(sort, order, limit, offset);
    const totalCustomers = await getAllCustomersCount() // getting total count of customers in db, ALSO BE CAUTIOUS ABOUT SIGNATURE OF getAllCustomersCount() AS getAllCustomers() Except LIMIT & OFFSET
    const data = {
        data: customers,
        page: req.query.pagination.page,
        limit: limit,
        count : customers.length, // this is the number of rows returned by psql, not total rows in db, for that we need to do another query to count total rows in db.
        total: totalCustomers, // this is the total number of rows in db of customers table
        totalPages: Math.ceil(totalCustomers / limit) // this is the total number of pages available in db.
    }
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, data);
}

// REQUIRE AUTH
async function updateCustomerMeHandler(req, res){
    if((!validateUpdateCustomerDetails(req))){// id in jwt should match with requested 'id' in body to be updated becuase it's not admin request
        throw new BadRequestError("Invalid customer details");
    }
    // USING req.user.id BECAUSE it's a self update request , Also sequence should be id, email, name, age, city in argument
    const result = await updateCustomer(req.user.id, req.body.email, req.body.name, req.body.age, req.body.city);
    // in case customer did not exist, result will be null, so we will send 404 not found
    if(result === null){
        throw new NotFoundError("Resource not found");
    }
    // returning returned updated row/customer
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, result);
}

// FOR admins, REQUIRE ADMIN AUTH
async function updateCustomerHandler(req, res){
    if(!validateUpdateCustomerDetails(req)){
        throw new BadRequestError("Invalid customer details");
    }
    // USING req.params.id BECAUSE admin can update any customer , Also sequence should be id, email, name, age, city in argument
    const result = await updateCustomer(req.params.id, req.body.email, req.body.name, req.body.age, req.body.city);
    // in case customer did not exist, result will be null, so we will send 404 not found
    if(result === null){
        throw new NotFoundError("Resource not found");
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

// FOR admins, REQUIRE ADMIN AUTH
async function deleteCustomerHandler(req, res){
    const result = await deleteCustomer(req.params.id); // using req.params.id because admin can delete any account
    res.statusCode = STATUS_CODES.NO_CONTENT; // usually 204 no content is send after successful deleteion without a body/payload
    res.end();
}



function refineQueryParams(req){
    if(req.query && req.query.sorting.sort === null){
        req.query.sorting.sort = "id"; // default sorting field is id
    }
}

export {createCustomerHandler, getCustomerMeHandler, getCustomerByIdHandler, getAllCustomersHandler, updateCustomerMeHandler, updateCustomerHandler, deleteCustomerMeHandler, deleteCustomerHandler};