import { parseBody } from "../src/middleware/body-parser.js";

describe("jest learning", function(){
    it("should add ", function(){
        expect(3+2).toBe(5);
    })
})

var req = {
    body: "",
    headers: {},
    on: function(arg, callback){
        if(arg === "data"){
            callback(Buffer.from(this.body));
        }
        else if(arg === "end"){
            callback();
        }
    },
    destroy: function(){
        // does noting for now
    }
}

describe("parseBody() testing", function(){

    // #1...call parseBody() with valid json body.
    var expectedJson = {"name": "Rahul", "age": 30}; // parseBody() returns JSON object after parsing successfully.
    it("should parse the json body ", async function(){   // async function because parseBody() returns a promise
        req.headers["content-type"] = "application/json";
        req.body = JSON.stringify({
            "name": "Rahul", "age": 30
        });
        var result = await parseBody(req);  // parseBody() returns a promise so we need to use await to get the resolved value of that promise.
        expect(result).toEqual(expectedJson);
    })
})

/*
Jest is another program which is executed by node.js itself.
It is a testing framework which prepares testing environment, list files and collect results and many more(which I don't know ).
when we do "npm install jest" then node installs this program in node modules and get listed in package.json.
When we do npx jest then node.js executes this jest program(YES it is executed by node.js on top of it).
Now jest prepares the testing environment like list all the .test.js files, initializes 'describe', 'it', 'expect'... Then instructs node.js to execute those files and tests .
Now when node.js starts executing these tests then now it knows what describe, it, expect.... are because jest initialises them before execution of those test files.
Jest stores the results of these files execution and submits.

Lets try to understand what parseBody() needs to be given.
It needs one argument 'req'. Here 'req' is an object. So lets create that one.
var req = {};

Next inside the parseBody() we can see it does => req.headers["content-type"];  Which is nothing just 'headers' is a property in 'req' which should be like:
var req = {
    headers: {"content-type": "application/json"},
}

Next inside the parseBody() we can see =>
req.on("data", function(chunk){

})
and
req.on("end", function(){

})
So we can another property 'on' but it is a function.
var req = {
    headers: {"content-type": "application/json"},
    on: function(){

    }
}

But notice on() taking 2 args, 1 is simple argument but 2nd is a callback method.

var req = {
    headers: {"content-type": "application/json"},
    on: function(arg, callback){

    }
}

See when 1st arg is "data" then to the callback, one arg is provided but when 1st arg is "end" then no arg is provided

var req = {
    headers: {"content-type": "application/json"},
    on: function(arg, callback){
        if(arg === "data"){
            callback(dummyChunk);
        }
        else if(arg === "end"){
            callback();
        }
    }
}

Now remember the arg callback recieve in case of "data" is a chunk, means a buffer.

var req = {
    headers: {"content-type": "application/json"},
    on: function(arg, callback){
        if(arg === "data"){
            callback(Buffer.from('{"name": "Rahul", "age": 30'}));
        }
        else if(arg === "end"){
            callback();
        }
    }
}

Next inside parseBody() 'destroy()' is also used so just declare that as well.
var req = {
    headers: {"content-type": "application/json"},
    on: function(arg, callback){
        if(arg === "data"){
            callback(Buffer.from('{"name": "Rahul", "age": 30}'));
        }
        else if(arg === "end"){
            callback();
        }
    },
    destroy: function(){
        // does noting for now
    }
}

next we can create separate variables for 'application-type' and 'Buffer':
var req = {
    headers: {},
    on: function(arg, callback){
        if(arg === "data"){
            callback(Buffer.from(body));
        }
        else if(arg === "end"){
            callback();
        }
    },
    destroy: function(){
        // does noting for now
    }
}


before sending the 'req' we can do:
var body = JSON.stringify({
    "name": "Rahul",
    "age": 30
})
req.headers["content-type"] = "application/json";

#1.....
our parseBody() receives chunks as Buffer and then after parsing returns a JSON object.
*/