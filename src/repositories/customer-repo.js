import {pool} from '../db/connection.js';

async function findCustomerByEmail(email){
    const result = await pool.query(
        `SELECT id, email, name, age, city FROM customers
        WHERE email = $1`, [email]
    );
    return result.rows[0] || null; // if no customer found then result.rows[0] will be undefined so return null in that case
}

async function createCustomer(client, email, name, age, city){ // after creating we are asking psql to return the newly created customer data as well.
    const result = await client.query(
        `INSERT INTO customers (email, name, age, city)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, age, city`, [email, name, age, city]
    );
    return result.rows[0];
}

export { findCustomerByEmail, createCustomer };

/*
pool.query() can take 1 arg or 2 args as well.
'$1' collectively called as parameters or placeholders in psql query. And 2nd arg is an array of value which will be used to replace placeholder in query by psql.
Here $1 will be replaced by 1st element of array.
suppose there are multiple placeholders like $1, $2, $3.. then the argument array should contain values in same order like [value1, value2, value3...]

What pool.query() returns:
It returns an object. And that object contains property 'rows' which is an array of rows returned by query.

*/