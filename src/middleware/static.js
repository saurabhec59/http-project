import fs from 'fs/promises';
import path from 'path';
import {MIME_TYPES} from '../utils/mime-types.js';
import responseBuilder from '../core/response-builder.js';
import STATUS_CODES from '../utils/status-codes.js';

const PUBLIC_DIR = path.resolve("../../public"); // #1.. this is the relative path to public directory from where we are starting node.js server(/core). we will use this to build the relative path to the requested file.
async function serveStaticFile(req, res, next){
    try{

        var parsedUrl = new URL(req.url, "http://localhost:3000"); // #3.....
        //var filePath = path.join(PUBLIC_DIR, parsedUrl.pathname); // #a path.join() returns the normalized path by joining all given arguments together. like if we give path.join("a", "b", "/c/d") then it will return "a/b/c/d".
        var filePath = path.resolve(PUBLIC_DIR, "." + parsedUrl.pathname); // parsedUrl.pathname may start with "/" and a path starting with "/" is treated as absolute path on POSIX systems, so adding "." before it make it relative.
        if(filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)){ // path.sep used to append "/" or "\" depending on os. Gpt this to understand this part.
            return next(); // ideally this should throw 403 forbidden but for simplicity we are returning false-> server.js will run routeMatch() -> will return nothing-> 404
        }
        var fileStats = await fs.stat(filePath); //#4...
        if(fileStats.isDirectory()){
            filePath = path.join(filePath,"index.html");// so if req was '/' return file '/index.html' and if req was '/users/' return file '/users/index.html' and so on. Just append index.html to pathname if it is a directory.
            fileStats = await fs.stat(filePath); // since filePath has changed so we need to get the stats again to use some properties like size, mtime, ctime..later.
        }
        var fileContent = await fs.readFile(filePath);
        var extension = path.extname(filePath); // #b..
        var mimeType = MIME_TYPES[extension] || "application/octet-stream"; // if extension is not found in MIME_TYPES object then we will set default content-type as "application/octet-stream" which is used for binary data.

        // building the response
        responseBuilder.sendStaticFileResponse(req, res, fileContent, mimeType, fileStats);
        return;
    }catch(e){
        if(e.code === "ENOENT"){ // ENOENT is the error code for file not found.
            return next(); // returning false so that router will run and if matchRoute() will not find any route then it will send 404
        }
        throw e; // if it is not 404 then there may be some other like permission denied, disk full etc.. which will fall into 500 internal SE and server.js will respond, not this method should.
    }
}

export {serveStaticFile};

/*
Till now we were returning response from in memory data so by simply writing res.write() we were able to send that because data was already in memory.
But if client wants to access static files like html (index.html), css (style.css), js files, images etc..
If he is sending requests like GET /index.html, GET /style.css, GET /img1.png...
These files are stored on disk so we need to read them from disk and store them as buffer in memory and then we can do res.write() ==> write() accepts string and buffer as well.
Node.js provides 'fs' module and using => fs.readFile(path) we can read the file from disk and it returns buffer so we can store that buffer in memory and then do res.write().

So now what flow we wants to achieve is:
==> get request url from client (like /index.html?name=Rahul&age=30)  --> req.url
==> extract pathname/file name from url (like /index.html)  -->  parsedUrl.pathname doing this here.
==> Build relative path because files are not exactly stored at those paths(like index.html could be at html-project/public/index.html)  --> #a path.join() doing this here.
==> check if the path ends with "/" then it is a directory --> fs.stats(path).isDirectory() becomes true.
==> if path is a directory then do not give that path directly to fs.readFile() to prevent 'EISDIR' error, instead we have to serve index.html file
==> pass that path to fs.readFile(pathname) to read the file content ==> now we have file content in memory as buffer ready to do res.write() but we need content-type to set in res.setHeader()
==> We will get extension from pathname  --> #b path.extname(parsedUrl.pathname) doing this here. parsedUrl.pathname -> /index.html  -> path.extname() -> .html ==> notice it is with dot.
==> Use the extension to get content-type from our MIME_TYPES object defined in utils/mime-types.js as MIME_TYPES[extension].
==> Now we have content-type and file content in memory so we can build and send the response.

=====> Now the important question is how to identify the requests which are for files?
One possible way is to register the routes for all files like addRoute(GET, "/index.html", serveStaticFile); but server may have hundreds of files and new can be added frequently and we can't register individual routes.
So just after logging the request in createServer() callback of server.js and before calling the route handler, we will check if url.method === "GET" then call this serveStaticFile() method with (req, res) objects
Then this method will try to extract pathname and will build relative path and try to read the file from disk.
If file is found at that path means it was a request for static file and will server the response and return true to the call in server.js --> then caller will return createServer() callback and no further processing will happen.
Else if file is not found here then this method will return false and createServer() callback will continue to call the route handler for that url.

#3....
var parsedUrl = new URL(req.url, "http://localhost:3000) ==> creates a new URL object from the given argument. It parses the URL and provides properties we will see.
new URL() needs full url (protocol + hostname+ port + path..) to parse it. But req.url only contains path and query string(like /index.html), that's why we give it additional base url so that
it have "http://localhost:3000.
Now the object returned by new URL() will have properties: (lets say req.url = "/index.html?name=Rahul&age=30")
parsedUrl.pathname => "/index.html"      ==> see here query string was present in url but new URL() has removed it properly.
parsedUrl.search => "?name=Rahul&age=30"  ==> this is the query string part of url.
There are many other properties of URL object but these 2 are important for us.

#4....
var fileStat = fs.stat(path) => returns an object containing information about the given path like:
fileStat.isDirectory() => it the url path is ending with "/" like "/users/", "/", "doc/"... then this will return true and we can send index.html files.
fileStat.isFile() => before calling fs.readFile() it is better to check if the path is a file or not because if it is a directory then fs.readFile() will throw 'EISDIR' error.
fileStat.size => size of file in bytes.
fileStat.mtime => last modified time of file.
fileStat.ctime => creation time of file.
*/