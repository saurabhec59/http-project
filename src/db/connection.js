import pg from 'pg';

const pool = new pg.Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
})

export { pool };

/*
'pg' ==> is a library provided by npm to connect PostgreSQL db to node.js program/server.
It provides a 'Pool' class which is used to CREATE & MANAGES a pool of connections (not a single connection) to the PostgreSQL db.
Pool also manages to reuse the connections from pool instead of creating a new connection for every request.

NOTE: In productions we often see pool = new pg.pool(); And pg implicitly takes the credentials from environment variables like 'PGHOST', 'PGPORT'...

Credentials like host, port, database, user, password I have putted in our .env file so process.env will be used to access them.
*/