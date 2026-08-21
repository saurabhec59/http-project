import {pool} from '../db/connection.js';

async function createRefreshToken(customer_id, token_hash, expires_at){
    const result = await pool.query(
        `INSERT INTO customer_refresh_tokens(customer_id, token_hash, expires_at)
         VALUES($1, $2, $3)
         RETURNING id, customer_id, expires_at, created_at`, [customer_id, token_hash, expires_at]
    );
    return result.rows[0];
}

export { createRefreshToken };

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