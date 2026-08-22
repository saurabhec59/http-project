import {pool} from '../db/connection.js';

async function createCredentials(client, customerId, hashedPassword, salt){
    const result = await client.query(
        `INSERT INTO customer_credentials(customer_id, password_hash, password_salt)
        VALUES ($1, $2, $3)`, [customerId, hashedPassword, salt]
    )
}

async function findCredentialsByCustomerId(customerId){
    const result = await pool.query(
        `SELECT password_salt, password_hash FROM customer_credentials
        WHERE customer_id = $1`, [customerId]
    )
    return result.rows[0] || null;
}

export {createCredentials, findCredentialsByCustomerId};