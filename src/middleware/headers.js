
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

export {parseContentType};

/*
#1......
Sometime contentType header looks like:=>   "mimeType; parameter1=value=value2
So if we do split("=") then it will return [" parameter1", "value", "value2"] and we will lose the 2nd value.
so to prevent that we are using indexOf("=")  because indexOf("=") will return the index of first occurrence of '=' in the string. So we can use that index to get parameter and value.
Because here in this ex: => "mimeType; parameter1=value=value2   => before 1st '=' is parameter and after that everything is value.
splitContent[i].indexOf("=") will return the index of '=' in the string. If '=' is not present then it will return -1.
*/