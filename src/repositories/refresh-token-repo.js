import {pool} from '../db/connection.js';

async function createRefreshToken(customer_id, token_hash, expires_at){
    const result = await pool.query(
        `INSERT INTO customer_refresh_tokens(customer_id, token_hash, expires_at)
         VALUES($1, $2, $3)
         RETURNING id, customer_id, expires_at, created_at`, [customer_id, token_hash, expires_at]
    );
    return result.rows[0];
}

async function findHashedRefreshToken(token_hash){
    const result = await pool.query(
        `SELECT customer_id, expires_at
        FROM customer_refresh_tokens
        WHERE token_hash = $1`, [token_hash]
    );
    return result.rows[0] || null; // if no token found then result.rows[0] will be undefined so return null in that case
}

export { createRefreshToken, findHashedRefreshToken };

/*
we have created table with query:
CREATE TABLE customer_refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

*/