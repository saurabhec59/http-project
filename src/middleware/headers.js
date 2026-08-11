
/*
  Usually req.headers["content-type"] looks like  ==>     mimeType; parameter1=value; parameter2=value...
  here 'mimiType' is the media type for example "application/json" and parameter1, parameter2 are optional parameters for example "charset=utf-8"
*/
function parseContentType(req){

    var parsedContentType = {
        mimeType: "",
        parameters: {}
    }

    var contentType = req.headers["content-type"];
    if(!contentType){
        return parsedContentType; // return this object simply, caller can check if mediaType/mime exists or not.
    }
    var splitContent = contentType.split(";");
    // splitContent[0] = "mimeType"; splitContent[1] = " parameter1=value"; splitContent[2] = " parameter2=value";
    parsedContentType.mimeType = splitContent[0].trim();

    //now run loop from 2nd element of 'splitContent' to store parameters
    for(var i = 1; i<splitContent.length; i++){
        var index = splitContent[i].indexOf("="); // why not =>  splitContent[i].split("=");  ? #1.......

        // sometimes incorrect headers without '=' can be send by client. like "application/json; charset" So to prevent that check this, because when there will be no '=' then .indexOf("=") will return -1.
        if(index === -1){ continue; }

        var parameter = splitContent[i].substring(0, index).trim(); // splitContent[i] = " parameter1=value";
        var value = splitContent[i].substring(index+1).trim();
        parsedContentType.parameters[parameter] = value;
    }

    return parsedContentType;
}

// #2.....
function parseAccept(req){

    //Accept: application/json, text/html...
    var parsedAccept = [];

    var accept = req.headers["accept"]; // accept will contain something like: application/json, text/html, ...
    if(!accept){
        return parsedAccept; // return empty array simply, caller can check if any mimeType send or not
    }

    var splitAccept = accept.split(",");
    // splitAccept[0] = "application/json"; splitAccept[1] = "text/html"...
    for(var i = 0; i<splitAccept.length; i++){
        parsedAccept.push(splitAccept[i].split(";")[0].trim()); // strip q-value if present // Read carefully
    }

    return parsedAccept;
}

//3.....
function parseAuthorization(req){
    var parsedAuthorization = {
        scheme: "",
        credentials: ""
    }

    //    Authorization: Basic kdfiekdkdkdkdkk
    var parseAuthHeader = req.headers["authorization"];
    if(!parseAuthHeader){ return parsedAuthorization; } // return empty object, caller can check

    var splitAuthorization = parseAuthHeader.split(" ");
    if(splitAuthorization.length < 2){ // sometimes client can send header without credential like: Authorization: Basic  , there splitAuthorization[1] can be undefined so simply return empty object
        return parsedAuthorization;
    }
    parsedAuthorization.scheme = splitAuthorization[0].trim(); // "Basic"
    parsedAuthorization.credentials = splitAuthorization[1].trim(); // "kdfiekdkdkdkdkk"

    return parsedAuthorization;
}

export {parseContentType, parseAccept, parseAuthorization};

/*
#1......
Sometime contentType header looks like:=>   "mimeType; parameter1=value=value2
So if we do split("=") then it will return [" parameter1", "value", "value2"] and we will lose the 2nd value.
so to prevent that we are using indexOf("=")  because indexOf("=") will return the index of first occurrence of '=' in the string. So we can use that index to get parameter and value.
Because here in this ex: => "mimeType; parameter1=value=value2   => before 1st '=' is parameter and after that everything is value.
splitContent[i].indexOf("=") will return the index of '=' in the string. If '=' is not present then it will return -1.

#2....
Accept header mostly send by client only to tell the server what type of response it can accept. It can contain multiple mime types separated by comma. For example:
Accept: application/json
Accept: application/json, text/html
It can also contain a quality (q) value:   Accept: application/json; q=1.0, text/html; q=0.8, text/plain; q=0.5    ==> q value represents the client's preference. Higher q = more preferred.
It can also contain wildcards: '*'   ==> means support any media type.
For simplicity we will not implement q value and wildcards in this task. We will just parse the Accept header and return an array of mime types.

#3....
How typically 'Authorization:' header looks like:   Authorization: Basic kdfiekdkdkdkdkk
Here 'Basic' is called schema and 'kdfiekdkdkdkdkk' called credentials.
The scheme tells the server how the credentials are supposed to be read, interpreted and used.
Like 'Basic' schema knows how to read the credential if it is in formats base64 encoded.
Similarly 'Bearer' which is another schema knows how to read the credential if it is a JWT token and many others.
That's why while sending the credentials in Authorization header, clients used to specify the schema to use to read that credential.

So if server wants to use  Basic type of authentication then, it expects header:   Authorization: Basic Base64encodedcredentials
And if server did not get it then in response server sends header:
WWW-Authenticate: Basic realm="Admin"     to the client stating that I am expecting an Authorization header for this request with Basic schema type.

if server wants to use JWT authentication then it expects header:   Authorization: Bearer credentialsAsJWTToken
And if server did not get it then in response server sends header:
WWW-Authenticate: Bearer

But the thing to keep in mind is that in JWT type of authentication, it's the server who creates this credential as JWT token and sends 1st to client and then afterwards client sends same to server ,
whereas base64 encoded credentials are created by client only.
*/