const middlewares = [];

function use(middleware) {
    middlewares.push(middleware);
}

async function run(req, res) {

    let index = 0;

    async function next() {

        if(index >= middlewares.length){
            return;
        }

        const middleware = middlewares[index];
        index++;

        await middleware(req, res, next);
    }

    await next();
}

export { use, run };