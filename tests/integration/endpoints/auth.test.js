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

    // Close pool after all tests
    afterAll(async function(){
        await pool.end();
    });

})