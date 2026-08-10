//Cookie: sessionId=abc123; theme=dark; language=en
function parseCookies(req){

    const parsedCookie = {};

    var cookie = req.headers["cookie"];
    if(!cookie){ return parsedCookie; }

    var splitCookie = cookie.split(";");
    // splitCookie[0] = " sessionId=abc123";  splitCookie[1] " theme=dark";
    for(var i=0; i<splitCookie.length; i++){
        var index = splitCookie[i].indexOf("=");// it will give index of "="
        if(index === -1){ continue; }// means there is no '=' in that parameter, may be malformed so skip that parameter

        var key = splitCookie[i].substring(0, index).trim();
        var value = splitCookie[i].substring(index+1).trim();

        parsedCookie[key]=value;
    }
    return parsedCookie;
}