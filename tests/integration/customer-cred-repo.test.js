import {testPool} from './config.js';
import {createCustomer} from '../../src/repositories/customer-repo.js';
import {createCredentials, findCredentialsByCustomerId} from '../../src/repositories/customer-cred-repo.js';

/*
Integration Tests for customer-cred-repo.js
These tests verify that customer credentials repository functions work correctly with the database.
Credentials are stored separately in customer_credentials table with foreign key to customers table.

Note: We need to create a customer FIRST before creating credentials (foreign key constraint).
*/

describe("customer-cred-repo.js - Integration Tests", function(){

    describe("createCredentials", function(){
        it("should create credentials and return credential object", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                // Create customer first (foreign key requirement)
                const customer = await createCustomer("cred@example.com", "Cred User", 30, "City", client);

                // Create credentials for that customer
                const result = await createCredentials(customer.id, "hashed_password_123", "salt_abc", client);

                expect(result).toBeDefined();
                expect(result.customer_id).toBe(customer.id);
                expect(result.password_hash).toBe("hashed_password_123");
                expect(result.password_salt).toBe("salt_abc");

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

    })

    describe("findCredentialsByCustomerId", function(){
        it("should find credentials when they exist", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                // create customer first and then create credentials for that customer
                const customer = await createCustomer("find@example.com", "Find User", 28, "City", client);
                await createCredentials(customer.id, "hash_value", "salt_value", client);

                const found = await findCredentialsByCustomerId(customer.id, client);

                expect(found).toBeDefined();
                expect(found.password_hash).toBe("hash_value");
                expect(found.password_salt).toBe("salt_value");

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return null when credentials do not exist", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                const result = await findCredentialsByCustomerId(999999, client);

                expect(result).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return null when customer exists but has no credentials", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                // Create customer but don't create credentials
                const customer = await createCustomer("nocreds@example.com", "No Creds User", 35, "City", client);

                const result = await findCredentialsByCustomerId(customer.id, client);

                expect(result).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should retrieve correct credentials for specific customer among multiple", async function(){
            const client = await testPool.connect();
            try {
                await client.query('BEGIN');

                // Create multiple customers with credentials
                const customer1 = await createCustomer("user1@example.com", "User 1", 20, "City", client);
                await createCredentials(customer1.id, "hash1", "salt1", client);

                const customer2 = await createCustomer("user2@example.com", "User 2", 30, "City", client);
                await createCredentials(customer2.id, "hash2", "salt2", client);

                const customer3 = await createCustomer("user3@example.com", "User 3", 40, "City", client);
                await createCredentials(customer3.id, "hash3", "salt3", client);

                // Find credentials for customer2
                const found = await findCredentialsByCustomerId(customer2.id, client);

                expect(found.password_hash).toBe("hash2");
                expect(found.password_salt).toBe("salt2");

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