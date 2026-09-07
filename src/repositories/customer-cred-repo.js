import {pool} from '../db/connection.js';

async function createCredentials(customerId, hashedPassword, salt, client = null){
    const executor = client || pool;
    const result = await executor.query(
        `INSERT INTO customer_credentials(customer_id, password_hash, password_salt)
        VALUES ($1, $2, $3)
        RETURNING customer_id, password_hash, password_salt`, [customerId, hashedPassword, salt]
    )
    return result.rows[0];
}

async function findCredentialsByCustomerId(customerId, client = null){
    const executor = client || pool;
    const result = await executor.query(
        `SELECT password_salt, password_hash FROM customer_credentials
        WHERE customer_id = $1`, [customerId]
    )
    return result.rows[0] || null;
}

export {createCredentials, findCredentialsByCustomerId};