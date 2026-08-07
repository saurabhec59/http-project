import { getAll, create, getById, update, deleteById } from '../../data/store.js';
import responseBuilder from '../response-builder.js';
import STATUS_CODES from '../../utils/status-codes.js';
import {badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError} from '../../utils/error-responses.js';

function getAllUsersHandler(req, res){
    var users = getAll();
    responseBuilder.sendJsonResponse(res, users);
}

function createUserHandler(req, res){

    var user = req.body;
    create(user);
    // to varify data was saved
    res.statusCode = STATUS_CODES.CREATED; // 201 means resource is created successfully
    res.setHeader("Content-Type", "application/json"); // #1....
    res.write(JSON.stringify(getAll()));
    res.end();

}

function getUserByIdHandler(req, res){
    var user = getById(parseInt(req.params.id));
    if(!user){ // because getBYId() only loops through the array and if it does not find any user then it will not return anything and this variable 'user' will be undefined.
        var message = notFound("User with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }
    res.statusCode = STATUS_CODES.OK;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(user));
    res.end();
}

function partialUpdateByIdHandler(req, res){
    // lets say ONLY age we wants to change:

    var userAge = req.body;
    // 1st get the all data of user with that id
    var user = getById(parseInt(req.params.id));

    if(!user){
        var message = notFound("User with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }

    // now update only age
    user.age = userAge.age;
    // now call 'update' crud method of store.js with 'id' & updated user data
    update(parseInt(req.params.id), user);
    // OPTIONAL sending all user data after update
    var allUser = getAll();
    res.statusCode = STATUS_CODES.OK;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(allUser));
    res.end();
}

function fullUpdateByIdHandler(req, res){
    // This time we update name and age both:

    // get the name & age send in request body as json

    var userData = req.body;
    // 1st get the all data of user with that id
    var user = getById(parseInt(req.params.id));

    if(!user){
        var message = notFound("User with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }

    // now update name & age
    user.name = userData.name;
    user.age = userData.age;
    // now call 'update' crud method of store.js with 'id' & updated user data
    update(parseInt(req.params.id), user);
    // OPTIONAL sending all user data after update
    var allUser = getAll();
    res.statusCode = STATUS_CODES.OK;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(allUser));
    res.end();

}

function deleteUserHandler(req, res){
    var user = getById(parseInt(req.params.id));
    if(!user){
        var message = notFound("User with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }

    // calling deleteById() method of store.js to delete user with that id
    deleteById(parseInt(req.params.id));

    // OPTIONAL sending all users list to verify user deleted
    var allUser = getAll();
    res.statusCode = STATUS_CODES.OK; // #2...
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(allUser));
    res.end();
}

export { getAllUsersHandler, createUserHandler, getUserByIdHandler, partialUpdateByIdHandler, fullUpdateByIdHandler, deleteUserHandler };

/*
#1......
when the line create(user); is executed then the user is created and saved in memory but to let the client know that this has been saved, we are doing =>         res.write(JSON.stringify(getAll()));
means getAll() will return all users including newly created as well.

#2......
usually after delete the status code is 204 which means operation successful & "no content" and if you try to send any payload like res.write() or res.end() then node.js
will discard it and will not send payload to client(but deletion will happen).
but here we want to see also that user is deleted that's why to send payload I am setting status code to 200.
*/