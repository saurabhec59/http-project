import { getAll, create, getById, update, deleteById } from '../../data/store.js';
import responseBuilder from '../response-builder.js';
import STATUS_CODES from '../../utils/status-codes.js';
import {badRequest, unauthorized, forbidden, notFound, methodNotAllowed, requestTimeOut, payloadTooLarge, conflict, unprocessableEntity, internalServerError} from '../../utils/error-responses.js';
import {applyQueryParams} from '../../utils/query-handler.js';
import {parseQueryString} from '../../utils/query-parser.js';

function getAllUsersHandler(req, res){
    var users = getAll();
    var result = applyQueryParams(users, req.query); // server.js already assigned parsed query params object to 'req' as 'req.query'.
    res.setHeader("Cache-Control", "max-age=10"); // #4.....
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, result);
}

function createUserHandler(req, res){

    var user = req.body;
    var newUser = create(user); // #3..... now after creating the new user, create() method will return the newly created user object
    // to varify data was saved
    res.setHeader("Location", "/users/" + newUser.id);
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.CREATED, newUser); // 201-> created successfully
}

function getUserByIdHandler(req, res){
    var user = getById(parseInt(req.params.id));
    if(!user){ // because getBYId() only loops through the array and if it does not find any user then it will not return anything and this variable 'user' will be undefined.
        var message = notFound("User with id " + req.params.id + " not found");
        responseBuilder.send404Response(res, message);
        return;
    }
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, user);
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
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, allUser);
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
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, allUser);
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
    res.setHeader("Cache-Control", "no-cache"); // we are allowing client to cache this response but he must validate with server before using that cached response because after each deletion the updated list should be sent to client.
    responseBuilder.sendJsonResponse(req, res, STATUS_CODES.OK, allUser);
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

#3......
Usually after creating a new resource the status code is 201 which means "created" and also we should send the newly created resource in the response body, if not entire created object then atleast the location/path of
that object. And that path should be send in response header "Location".
When "Location" header is sent with status code 302 that means it is redirect path and client redirects to that path, but when "Location" header is sent with status code 201 then client do not redirect and for that it
means the path of resource is here which he can use.
So here we changed create() of store.js to return the newly created user object after saving it.
After that the handler of this file will send that returned created user object in response body instead of sending all users. Also we added "Location" header in response with path.

#4..... Header "Cache-Control"
This header is used to control the caching behavior, usually it contains parameters/directives like "no-cache", "no-store", "max-age" ...separated by comma.
This header can be sent by both server and client as well.
ex: "Cache-Control: max-age=60"  ==> if this is sent by server then it means this response can be cached by client for 60s, lets say it was a browser and if withing 60s again user made same request then browser will
not make new request to server, instead it will use that cached response. Use case: logo.png of website, mostly it do not change frequently so servers use to send "max-age" parameter.
ex: "Cache-Control: no-store"  ==> if this is sent by server then it means this response should not be cached by client at all. Use case: login page, password reset page, payment page, etc.
ex: "Cache-Control: no-cache"  ==> if this is sent by server then it means this response can be cached by client but before using that cached response, client should check with server whether it is still valid or not.
There are many more parameters/directives of this header, we can explore them as per need..
*/