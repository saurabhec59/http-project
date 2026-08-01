import { getAll, create, getById, update, deleteById } from '../../data/store.js';
import responseBuilder from '../response-builder.js';

function getAllUsersHandler(req, res){
    var users = getAll();
    responseBuilder.sendJsonResponse(res, users);
}

function createUserHandler(req, res){
    var data = "";
    req.on("data", function(chunk){
        data += chunk.toString();
    })

    req.on("end", function(){
        var user = JSON.parse(data);  // converts string into json object but the string should be in valid json format otherwise it will throw error. So here we are just assuming that client is sending valid json only.
        create(user);
        // to varify data was saved
        res.statusCode = 201; // 201 means resource is created successfully
        res.setHeader("Content-Type", "application/json"); // #1....
        res.write(JSON.stringify(getAll()));
        res.end();
    })

}

function getUserByIdHandler(req, res){
    var user = getById(parseInt(req.params.id));
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify(user));
    res.end();
}

function partialUpdateByIdHandler(req, res){
    // lets say ONLY age we wants to change:

    // get the age no send in request body as json
    var userAge = "";
    req.on("data", function(chunk){
        userAge += chunk;
    })

    req.on("end", function(){
        userAge = JSON.parse(userAge);
        // 1st get the all data of user with that id
        var user = getById(parseInt(req.params.id));
        // now update only age
        user.age = userAge.age;
        // now call 'update' crud method of store.js with 'id' & updated user data
        update(parseInt(req.params.id), user);
        // OPTIONAL sending all user data after update
        var allUser = getAll();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(allUser));
        res.end();
    })
}

function fullUpdateByIdHandler(req, res){
    // This time we update name and age both:

    // get the name & age send in request body as json
    var userData = "";
    req.on("data", function(chunk){
        userData += chunk;
    })

    req.on("end", function(){
        userData = JSON.parse(userData);
        // 1st get the all data of user with that id
        var user = getById(parseInt(req.params.id));
        // now update name & age
        user.name = userData.name;
        user.age = userData.age;
        // now call 'update' crud method of store.js with 'id' & updated user data
        update(parseInt(req.params.id), user);
        // OPTIONAL sending all user data after update
        var allUser = getAll();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(allUser));
        res.end();
    })
}

function deleteUserHandler(req, res){
    // calling deleteById() method of store.js to delete user with that id
    deleteById(parseInt(req.params.id));

    // OPTIONAL sending all users list to verify user deleted
    var allUser = getAll();
    res.statusCode = 200; // #2...
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