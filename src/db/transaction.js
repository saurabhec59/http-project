import {pool} from './connection.js';

async function withTransaction(callbackMethod){
    const client = await pool.connect(); // this picks one available connection from pool
    try{
        await client.query("BEGIN"); // Start transaction
        const result = await callbackMethod(client); // Read it slowly and try to grasp it completely.
        await client.query("COMMIT"); // Commit transaction
        return result;
    }catch(e){
        // If any error occurred or any query failed then do rollback entire transaction
        await client.query("ROLLBACK");
        throw e;
    }finally{
        client.release();// release the acquired db connection from pool
    }
}

export {withTransaction};

/*
Transaction: a sequence of one or more SQL queries which are treated as single unit of work.
If all queries in transaction are successful then transaction is considered successful and commited to db.
If any query in transaction fails then entire transaction is considered failed and rolled back to db.

Now what we are doing here:
Lets see first how we are using 'pg' to execute queries:
    1st we did --> const pool = new pg.Pool({...});  // this creates a pool of connections to our psql db.
    Then we can do -->  pool.query("...QUERY_1...");   pool.query("...QUERY_2...");  pool.query("...QUERY_3...");
    Here there is a chance that all queries were executed by different connections from pool. Because pool.query() picks available connections from pool.
    But if our all 3 queries are connected to each other like:
    we are executing 1st query to create a customer, then 2nd query is to create credentials for that customer.
    And if somehow 2nd query fails then we will end up with a customer created but no credentials for that customer.
    That's why we need to consider both queries as single unit of work --> transaction.
But if we have multiple queries to execute in transaction then we can't use pool.query() because we need one connection to execute that transaction.

So we do:
    const client = pool.connect(); // connect() picks one available connection from pool and returns it as 'client' object.
    Now we can use this 'client' object to execute queries like:
    client.query("...QUERY_1...");   client.query("...QUERY_2...");  client.query("...QUERY_3..."); // ==> now all queries will be executed by same connection from pool.

*/