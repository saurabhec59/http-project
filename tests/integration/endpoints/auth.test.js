import request from 'supertest';
import app from '../../../src/core/app.js';
import {pool} from '../../../src/db/connection.js';
import {createCustomer} from '../../../src/repositories/customer-repo.js';
import {createCredentials} from '../../../src/repositories/customer-cred-repo.js';
import {hashPassword} from '../../../src/auth/hash.js';

/*
Endpoint Integration Tests for /auth/* routes

These tests verify the FULL HTTP request → response flow:
- HTTP request parsing
- Middleware execution (body parsing, CORS, etc.)
- Route handler logic
- Database operations
- Response formatting

Unlike repository tests (which test database directly), these tests:
- Use supertest to make HTTP requests
- Test the actual API interface
- Verify status codes, headers, response body structure
*/

describe("POST /auth/login", function(){

    describe("successful login", function(){
        it("should login with valid credentials and return JWT token", async function(){
            const client = await pool.connect();
            let customerId;
            try {
                // Setup: Create a customer with credentials (committed to DB, not in transaction)
                const customer = await createCustomer("login@example.com", "Login User", 30, "City", client);
                customerId = customer.id;

                const hashed = hashPassword("validpassword");
                await createCredentials(customer.id, hashed.hashedPassword, hashed.salt, client);

                // Act: Login with valid credentials
                const response = await request(app)
                    .post('/auth/login')
                    .send({
                        email: "login@example.com",
                        password: "validpassword"
                    });

                // Assert: Check response
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('jwtToken');
                const jwtToken = response.body.jwtToken;
                expect(typeof jwtToken).toBe('string');
                const parts = jwtToken.split('.');
                expect(parts.length).toBe(3); // JWT has 3 parts

                // Assert: Check Set-Cookie header for refresh token
                expect(response.headers['set-cookie']).toBeDefined();
                expect(response.headers['set-cookie'][0]).toContain('refresh_token=');
                expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
            } finally {
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })

    })

    describe("validation errors (400)", function(){
        it("should return 400 when email is missing", async function(){
            const response = await request(app)
                .post('/auth/login')
                .send({
                    password: "password123"
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        })

        it("should return 400 when password is missing", async function(){
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: "test@example.com"
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        })

        it("should return 400 when both email and password are missing", async function(){
            const response = await request(app)
                .post('/auth/login')
                .send({});

            expect(response.status).toBe(400);
        })

        it("should return 400 when email format is invalid", async function(){
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: "invalid-email",
                    password: "password123"
                });

            expect(response.status).toBe(400);
        })

        it("should return 400 when password is too short", async function(){
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: "test@example.com",
                    password: "short"  // Less than 8 characters
                });

            expect(response.status).toBe(400);
        })

        it("should return 400 when password is too long", async function(){
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: "test@example.com",
                    password: "toolongpassword1234"  // More than 15 characters
                });

            expect(response.status).toBe(400);
        })
    })

    describe("authentication errors (401)", function(){
        it("should return 401 when user does not exist", async function(){
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: "nonexistent@example.com",
                    password: "password123"
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        })

        it("should return 401 when password is incorrect", async function(){
            const client = await pool.connect();
            let customerId;
            try {
                // Setup: Create customer with correct password (committed to DB, not in transaction)
                const customer = await createCustomer("wrong@example.com", "Wrong User", 28, "City", client);
                customerId = customer.id;
                const hashed = hashPassword("correctpassword");
                await createCredentials(customer.id, hashed.hashedPassword, hashed.salt, client);

                // Act: Try to login with wrong password
                const response = await request(app)
                    .post('/auth/login')
                    .send({
                        email: "wrong@example.com",
                        password: "wrongpassword"
                    });

                // Assert: Should return 401 because password is incorrect
                expect(response.status).toBe(401);
            } finally {
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })
    })


})

describe("POST /auth/refresh", function(){

    describe("successful token refresh", function(){
        it("should return new JWT token when refresh token is valid", async function(){
            const client = await pool.connect();
            let customerId;
            try {
                // Setup: Create customer, credentials, and refresh token
                const customer = await createCustomer("refresh@example.com", "Refresh User", 30, "City", client);
                customerId = customer.id;

                const hashed = hashPassword("password123");
                await createCredentials(customer.id, hashed.hashedPassword, hashed.salt, client);

                // Login to get refresh token
                const loginResponse = await request(app)
                    .post('/auth/login')
                    .send({
                        email: "refresh@example.com",
                        password: "password123"
                    });

                // Extract refresh_token from Set-Cookie header
                const setCookieHeader = loginResponse.headers['set-cookie'][0];
                const refreshToken = setCookieHeader.split('refresh_token=')[1].split(';')[0];

                // Act: Use refresh token to get new JWT
                const response = await request(app)
                    .post('/auth/refresh')
                    .set('Cookie', `refresh_token=${refreshToken}`);

                // Assert: Should return new JWT token
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('jwtToken');
                expect(typeof response.body.jwtToken).toBe('string');
                expect(response.body.jwtToken.length).toBeGreaterThan(0);

                // Verify JWT structure
                const parts = response.body.jwtToken.split('.');
                expect(parts.length).toBe(3);
            } finally {
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })
    })

    describe("authentication errors (401)", function(){
        it("should return 401 when refresh token is missing", async function(){
            // Act: Call refresh endpoint without Cookie header
            const response = await request(app)
                .post('/auth/refresh');

            // Assert: Should return 401
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        })

        it("should return 401 when refresh token is invalid", async function(){
            // Act: Call refresh endpoint with invalid token
            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', 'refresh_token=invalid_token_12345');

            // Assert: Should return 401
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        })

        it("should return 401 when refresh token is expired", async function(){
            const client = await pool.connect();
            let customerId;
            try {
                // Setup: Create customer with expired refresh token
                const customer = await createCustomer("expired@example.com", "Expired User", 30, "City", client);
                customerId = customer.id;

                const hashed = hashPassword("password123");
                await createCredentials(customer.id, hashed.hashedPassword, hashed.salt, client);

                // Create expired refresh token (1 day in the past)
                const crypto = await import('crypto');
                const plainRefreshToken = crypto.randomBytes(32).toString('hex');
                const hashedRefreshToken = crypto.createHash('sha-256').update(plainRefreshToken).digest('hex');
                const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

                await client.query(
                    'INSERT INTO customer_refresh_tokens (customer_id, token_hash, expires_at) VALUES ($1, $2, $3)',
                    [customer.id, hashedRefreshToken, expiredDate]
                );

                // Act: Try to use expired refresh token
                const response = await request(app)
                    .post('/auth/refresh')
                    .set('Cookie', `refresh_token=${plainRefreshToken}`);

                // Assert: Should return 401
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('error');
            } finally {
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })
    })

})

describe("POST /auth/logout", function(){

    describe("successful logout", function(){
        it("should logout successfully when refresh token is valid", async function(){
            const client = await pool.connect();
            let customerId;
            try {
                // Setup: Create customer and login to get refresh token
                const customer = await createCustomer("logout@example.com", "Logout User", 30, "City", client);
                customerId = customer.id;

                const hashed = hashPassword("password123");
                await createCredentials(customer.id, hashed.hashedPassword, hashed.salt, client);

                // Login to get refresh token
                const loginResponse = await request(app)
                    .post('/auth/login')
                    .send({
                        email: "logout@example.com",
                        password: "password123"
                    });

                const setCookieHeader = loginResponse.headers['set-cookie'][0];
                const refreshToken = setCookieHeader.split('refresh_token=')[1].split(';')[0];

                // Act: Logout with refresh token
                const response = await request(app)
                    .post('/auth/logout')
                    .set('Cookie', `refresh_token=${refreshToken}`);

                // Assert: Should return 200 with success message
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toBe("Logout successfully");

                // Verify: Refresh token should be deleted from database
                const checkToken = await client.query(
                    'SELECT * FROM customer_refresh_tokens WHERE customer_id = $1',
                    [customer.id]
                );
                expect(checkToken.rows.length).toBe(0);
            } finally {
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })

        it("should return 200 even when refresh token is missing", async function(){
            // Act: Logout without refresh token
            const response = await request(app)
                .post('/auth/logout');

            // Assert: Should still return 200 (idempotent operation)
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe("Logout successfully");
        })

        it("should return 200 even when refresh token is invalid", async function(){
            // Act: Logout with invalid refresh token
            const response = await request(app)
                .post('/auth/logout')
                .set('Cookie', 'refresh_token=invalid_token_xyz');

            // Assert: Should return 200 (token doesn't exist in DB, nothing to delete)
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe("Logout successfully");
        })
    })

})