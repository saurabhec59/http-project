function parseBody1(req){  // #1....
    var body = "";
    req.on("data", function(chunk){
        body += chunk;
    })

    req.on("end", function(){
        return body;
    })
}

// #2....
function parseBody(req){
    return new Promise(function(onSuccess, onFailure){ // usually devs use 'resolve' and 'reject' instead of onSuccess and onFailure

        var data = "";
        req.on("data", function(chunk){
            data += chunk;
        })

        req.on("end", function(){
            onSuccess(data);
        })
    })
}



/*
#1....
So whats happening here is method parseBody() is supposed to return the processed body/payload.
When the execution started then req.on() registers a callback and that callback is not executing yet.
Then method parseBody() executes req.on() which again registers a callback and that callback is not executing yet  BUT that registered callback will return the processed request data/payload.
Then method parseBody() do not have left anything to execute so it will return.

So if someone was calling it to receive the data like this:
var payload  = parseBody(req);
then it will be undefined because parseBody() just returned.

so what happened with "return body;" statement?
That statement is inside the callback of req.on("end") and and will be invoked by node.js after completion of req.on("data")
and since no body is listening to that so that return statement will be discarded because it was not return statement of method parseBody().

PROMISE:
When a function (here it is parseBody) depends on result of an asynchronous operation that will complete later (here asynchronous operation is reading req body)
then it (parseBody()) should return a promise to it's caller (whoever is calling parseBody()) so that it's caller can wait for the result.
#2.........
Now the function parseBody() is returning a Promise Object in the 1st line itself.
Also js provides 2 functions to callback of Promise Object.
Until either onSuccess or onFailure is called inside the parseBody() the caller will keep waiting.
Here I am not using 'onFailure' but it can be used later.
The moment parseBody() is called, it immediately returns a Promise object. Later, when onSuccess(data) is called, the Promise is fulfilled with data. Any caller waiting using await or .then() then receives data as the result.
*/