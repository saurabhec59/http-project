/*
    File app.js is creating the http server instance and exporting it but not starting it.
    This file server.js is importing the server instance and starting it on port 3000.
    so exporting this file will start the server on port 3000.
*/
import server from './app.js';
import {info} from '../utils/logger.js';

const port = 3000;
server.listen(port, function(){
    info("server is listening on port " + port);
})
