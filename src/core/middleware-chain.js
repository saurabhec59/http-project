const middlewares = [];
var errorMiddleware = null;

function use(middleware) {
    middlewares.push(middleware);
}
function useErrorHandler(middleware){
    errorMiddleware = middleware;
}

async function run(req, res) {

    let index = 0;

    async function next() {

        if(index >= middlewares.length){
            return;
        }

        const middleware = middlewares[index];
        index++;

        try{
            await middleware(req, res, next);
        }catch(err){
            if(errorMiddleware){
                await errorMiddleware(err, req, res);
                return;
            }
            throw err; // in case if errorMiddleware in not set in server.js
        }
    }

    await next();
}

export { use, run, useErrorHandler };