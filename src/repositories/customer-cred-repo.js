//import {pool} from '../db/connection.js';

async function createCredentials(client, customerId, hashedPassword, salt){
    const result = await client.query(
        `INSERT INTO customer_credentials(customer_id, password_hash, password_salt)
        VALUES ($1, $2, $3)`, [customerId, hashedPassword, salt]
    )
}

export {createCredentials};