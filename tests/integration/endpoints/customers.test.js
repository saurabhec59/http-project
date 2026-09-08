import request from 'supertest';
import app from '../../../src/core/app.js';
import {pool} from '../../../src/db/connection.js';
import {findCustomerByEmail, createCustomer} from '../../../src/repositories/customer-repo.js';
import {findCredentialsByCustomerId} from '../../../src/repositories/customer-cred-repo.js';

describe("POST /auth/register", function(){
    describe("successful registration", function(){

        it("should create a customer with valid details", async function(){

            const client = await pool.connect();
            let customerId;

            try{
                const response = await request(app)
                    .post("/auth/register")
                    .send({
                        "email": "testuser@gmail.com",
                        "name": "Test User",
                        "age": 25,
                        "city": "Test City",
                        "password": "testpassword"
                    })

                expect(response.status).toBe(201);
                // toMatchObject will check if the object has the specified properties and values, and IGNORE any EXTRA properties. expect.any(Number) is used to check if the id is a number.
                expect(response.body).toMatchObject({
                    id: expect.any(Number),
                    email: "testuser@gmail.com",
                    name: "Test User",
                    age: 25,
                    city: "Test City",
                    role: null
                });
                expect(response.body).not.toHaveProperty("password");
                customerId = response.body.id;  // store the created customer id for cleanup

                // verify that the customer was actually created in the database
                const createdCustomer = await findCustomerByEmail("testuser@gmail.com", client);
                expect(createdCustomer).not.toBeNull();
                expect(createdCustomer).toMatchObject({
                    id: customerId,
                    email: "testuser@gmail.com",
                    name: "Test User",
                    age: 25,
                    city: "Test City",
                    role: null
                });

                // verify that the credentials were actually created in the database and that the password is hashed and salted
                const createdCredentials = await findCredentialsByCustomerId(customerId, client);
                expect(createdCredentials).not.toBeNull();
                expect(createdCredentials.password_hash).toBeDefined();
                expect(createdCredentials.password_salt).toBeDefined();
                expect(createdCredentials.password_hash).not.toBe("testpassword");
            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                else{ // fallback
                    await client.query('DELETE FROM customers WHERE email = $1', ["testuser@gmail.com"]);
                }
                client.release();
            }

        })
    })

    describe("unsuccessful registration", function(){

        it("should return 400 for missing required field email", async function(){
            const response = await request(app)
                .post("/auth/register")
                .send({
                    "name": "Test User",
                    "age": 25,
                    "city": "Test City",
                    "password": "testpassword"
                })
            expect(response.status).toBe(400);
        })

        it("should return 400 for missing required field name", async function(){
            const response = await request(app)
                .post("/auth/register")
                .send({
                    "email": "testuser@gmail.com",
                    "age": 25,
                    "city": "Test City",
                    "password": "testpassword"
                })
            expect(response.status).toBe(400);
        })

        it("should return 400 for missing required field age", async function(){
            const response = await request(app)
                .post("/auth/register")
                .send({
                    "email": "testuser@gmail.com",
                    "name": "Test User",
                    "city": "Test City",
                    "password": "testpassword"
                })

            expect(response.status).toBe(400);
        })

        it("should return 409 for duplicate email registration", async function(){

            const client = await pool.connect();
            let customerId;
            try{
                const customer = await createCustomer("testuser1@gmail.com", "Test User 1", 30, "Test City", client);
                customerId = customer.id;

                const response = await request(app)
                    .post("/auth/register")
                    .send({
                        "email": "testuser1@gmail.com",
                        "name": "Test User",
                        "age": 25,
                        "city": "Test City",
                        "password": "testpassword"
                    })

                expect(response.status).toBe(409);
            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }

        })
    })
})