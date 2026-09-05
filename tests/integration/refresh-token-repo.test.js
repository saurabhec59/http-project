import {testPool} from './config.js';
import {createCustomer} from '../../src/repositories/customer-repo.js';
import {createRefreshToken, findHashedRefreshToken, deleteRefreshToken} from '../../src/repositories/refresh-token-repo.js';

/*
Integration Tests for refresh-token-repo.js

These tests verify that refresh token repository functions work correctly with the database.
Refresh tokens are stored in customer_refresh_tokens table with foreign key to customers table.

Note: We need to create a customer FIRST before creating refresh tokens (foreign key constraint).
*/

describe("refresh-token-repo.js - Integration Tests", function(){

    describe("createRefreshToken", function(){
        it("should create refresh token and return token object with all fields", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                // Create customer first (foreign key requirement)
                const customer = await createCustomer("token@example.com", "Token User", 30, "City", client);

                // Create refresh token
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
                const result = await createRefreshToken(customer.id, "hashed_token_abc123", expiresAt, client);

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.customer_id).toBe(customer.id);
                expect(result.token_hash).toBe("hashed_token_abc123");
                expect(result.expires_at).toBeDefined();
                expect(result.created_at).toBeDefined();

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should create token with correct expiry date", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                const customer = await createCustomer("expiry@example.com", "Expiry User", 25, "City", client);

                const expiresAt = new Date('2026-12-31');
                const result = await createRefreshToken(customer.id, "token_hash_xyz", expiresAt, client);

                // Compare timestamps (PostgreSQL returns as Date object)
                expect(new Date(result.expires_at).toISOString()).toBe(expiresAt.toISOString());

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should allow multiple tokens for same customer", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                const customer = await createCustomer("multi@example.com", "Multi User", 28, "City", client);

                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const token1 = await createRefreshToken(customer.id, "token_hash_1", expiresAt, client);
                const token2 = await createRefreshToken(customer.id, "token_hash_2", expiresAt, client);

                expect(token1.id).not.toBe(token2.id);
                expect(token1.customer_id).toBe(customer.id);
                expect(token2.customer_id).toBe(customer.id);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

    describe("findHashedRefreshToken", function(){
        it("should find token by hash when it exists", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                // create customer first and then create refresh token for that customer
                const customer = await createCustomer("find@example.com", "Find User", 35, "City", client);
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                await createRefreshToken(customer.id, "findable_token_hash", expiresAt, client);

                const found = await findHashedRefreshToken("findable_token_hash", client);

                expect(found).toBeDefined();
                expect(found.customer_id).toBe(customer.id);
                expect(found.expires_at).toBeDefined();

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return null when token hash does not exist", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                const result = await findHashedRefreshToken("nonexistent_token_hash", client);

                expect(result).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should find correct token among multiple tokens", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                const customer1 = await createCustomer("user1@example.com", "User 1", 20, "City", client);
                const customer2 = await createCustomer("user2@example.com", "User 2", 30, "City", client);
                const customer3 = await createCustomer("user3@example.com", "User 3", 40, "City", client);

                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                await createRefreshToken(customer1.id, "token_hash_a", expiresAt, client);
                await createRefreshToken(customer2.id, "token_hash_b", expiresAt, client);
                await createRefreshToken(customer3.id, "token_hash_c", expiresAt, client);

                const found = await findHashedRefreshToken("token_hash_b", client);

                expect(found.customer_id).toBe(customer2.id);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

    describe("deleteRefreshToken", function(){
        it("should delete token and return rowCount of 1", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                // create customer first and then create refresh token for that customer and then delete it
                const customer = await createCustomer("delete@example.com", "Delete User", 30, "City", client);
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                await createRefreshToken(customer.id, "deletable_token", expiresAt, client);

                const rowCount = await deleteRefreshToken("deletable_token", client);

                expect(rowCount).toBe(1);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return rowCount of 0 when token does not exist", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                const rowCount = await deleteRefreshToken("nonexistent_token", client);

                expect(rowCount).toBe(0);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should not find token after deletion", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                const customer = await createCustomer("verify@example.com", "Verify User", 32, "City", client);
                const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                await createRefreshToken(customer.id, "verify_delete_token", expiresAt, client);

                // Delete the token
                await deleteRefreshToken("verify_delete_token", client);

                // Try to find it
                const found = await findHashedRefreshToken("verify_delete_token", client);

                expect(found).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

    })

    // Close pool after all tests
    afterAll(async function(){
        await testPool.end();
    });

})