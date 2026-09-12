import request from 'supertest';
import app from '../../../src/core/app.js';
import {pool} from '../../../src/db/connection.js';
import {findCustomerByEmail, createCustomer} from '../../../src/repositories/customer-repo.js';
import {findCredentialsByCustomerId} from '../../../src/repositories/customer-cred-repo.js';
import {createAuthenticatedTestUser} from '../../helpers/auth-helper.js';

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

describe("GET /customers/me", function(){

    describe("successful retrieval of self details", function(){
        it("should return self details when correct JWT token is send", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                // get an authenticated test user before making the request for /customers/me
                const user = await createAuthenticatedTestUser(client);
                customerId = user.customerId; // store the created customer id for cleanup
                const response = await request(app)
                    .get("/customers/me")
                    .set("Authorization", `Bearer ${user.jwtToken}`);

                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    id: user.customerId,
                    email: user.email,
                    name: user.name,
                    age: user.age,
                    city: user.city,
                    role: null
                });
            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })
    })

    describe("unsuccessful retrieval of self details", function(){
        it("should return 401 unauthorized when Authorization header is missing", async function(){

            const response = await request(app)
                .get("/customers/me");

            expect(response.status).toBe(401);
        })

        it("should return 401 unauthorized when JWT token is missing", async function(){
            const response = await request(app)
                .get("/customers/me")
                .set("Authorization", "Bearer "); // empty

            expect(response.status).toBe(401);
        })

        it("should return 401 unauthorized when scheme is not Bearer", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                // get an authenticated test user before making the request for /customers/me
                const user = await createAuthenticatedTestUser(client);
                customerId = user.customerId; // store the created customer id for cleanup
                const response = await request(app)
                    .get("/customers/me")
                    .set("Authorization", `Basic ${user.jwtToken}`); // <<<=== wrong scheme, should be Bearer

                expect(response.status).toBe(401);

            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })

        it("should return 401 unauthorized when JWT token is incorrect", async function(){
            const response = await request(app)
                .get("/customers/me")
                .set("Authorization", "Bearer invalid.Bearer.token");

            expect(response.status).toBe(401);
        })
    })

})

describe("GET /customers/:id", function(){

    describe("successful retrieval of customer details by admin", function(){
        it("should return customer details when JWT token is valid and role is admin", async function(){

            const client = await pool.connect();
            let customer1Id, customer2Id;
            try{
                // get an authenticated test user with role = 'admin' before making the request
                const adminUser = await createAuthenticatedTestUser(client, {role: 'admin'});
                customer1Id = adminUser.customerId; // store the created customer id for cleanup

                // create another customer to get details of
                const user2 = await createAuthenticatedTestUser(client);
                customer2Id = user2.customerId;

                // admin user will make request with his jwt token to get details of customer2
                const response = await request(app)
                    .get(`/customers/${customer2Id}`)  // "customers/:id"
                    .set("Authorization", `Bearer ${adminUser.jwtToken}`)

                expect(response.status).toBe(200);
                expect(response.body).toMatchObject({
                    id: user2.customerId,
                    email: user2.email,
                    name: user2.name,
                    age: user2.age,
                    city: user2.city,
                    role: null
                });
            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customer1Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer1Id]);
                }
                if (customer2Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer2Id]);
                }
                client.release();
            }

        })
    })

    describe("Unsuccessful retrieval of customer details by admin", function(){
        it("should return 401 unauthorized when Authorization header is missing", async function(){

            const response = await request(app)
                .get("/customers/1"); // any id

            expect(response.status).toBe(401);
        })

        it("should return 401 unauthorized when JWT token is missing", async function(){
            const response = await request(app)
                .get("/customers/1") // any id
                .set("Authorization", "Bearer "); // empty

            expect(response.status).toBe(401);
        })

        it("should return 401 unauthorized when scheme is not Bearer", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                // get an authenticated test user before making the request for /customers/me
                const adminUser = await createAuthenticatedTestUser(client, {role: 'admin'});
                customerId = adminUser.customerId; // store the created customer id for cleanup
                const response = await request(app)
                    .get("/customers/1") // any id
                    .set("Authorization", `Basic ${adminUser.jwtToken}`); // <<<=== wrong scheme, should be Bearer

                expect(response.status).toBe(401);

            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })

        it("should return 401 unauthorized when JWT token is incorrect", async function(){
            const response = await request(app)
                .get("/customers/1")
                .set("Authorization", "Bearer invalid.Bearer.token");

            expect(response.status).toBe(401);
        })

        it("should return 404 not found when user does not exist", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                // get an authenticated test user before making the request for /customers/me
                const adminUser = await createAuthenticatedTestUser(client, {role: 'admin'});
                customerId = adminUser.customerId; // store the created customer id for cleanup
                const response = await request(app)
                    .get("/customers/999999") // any id which does not exist
                    .set("Authorization", `Bearer ${adminUser.jwtToken}`);

                expect(response.status).toBe(404);

            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })

        // no need to create a second user because during requireAdminAuth() itself the role will be checked and forbidden will be returned.
        it("should return 403 forbidden when JWT token is valid but role is not admin", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                // get an authenticated test user but role should NOT BE 'admin'
                const user = await createAuthenticatedTestUser(client); // role is not admin
                customerId = user.customerId; // store the created customer id for cleanup

                const response = await request(app)
                    .get("/customers/1") // any id
                    .set("Authorization", `Bearer ${user.jwtToken}`); // valid jwt token but role is not admin

                expect(response.status).toBe(403);
            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })

        it("should return 400 bad request when customer id format is invalid", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                const adminUser = await createAuthenticatedTestUser(client, {role: 'admin'});
                customerId = adminUser.customerId;

                const response = await request(app)
                    .get("/customers/invalid_id") // invalid id format
                    .set("Authorization", `Bearer ${adminUser.jwtToken}`);

                expect(response.status).toBe(400);
            }finally{
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })
    })
})

describe("GET /customers", function(){

    describe("successful retrieval of all customers by admin", function(){

        it("should return all 5 customers when JWT token is valid and role is admin", async function(){
            const client = await pool.connect();
            let adminId;
            let customer1Id, customer2Id, customer3Id, customer4Id, customer5Id;

            try{
                // create 5 customers
                const customer1 = await createCustomer(`testuser1_${Date.now()}@gmail.com`, "Test User 1", 30, "Test City", client);
                customer1Id = customer1.id;
                const customer2 = await createCustomer(`testuser2_${Date.now()}@gmail.com`, "Test User 2", 30, "Test City", client);
                customer2Id = customer2.id;
                const customer3 = await createCustomer(`testuser3_${Date.now()}@gmail.com`, "Test User 3", 30, "Test City", client);
                customer3Id = customer3.id;
                const customer4 = await createCustomer(`testuser4_${Date.now()}@gmail.com`, "Test User 4", 30, "Test City", client);
                customer4Id = customer4.id;
                const customer5 = await createCustomer(`testuser5_${Date.now()}@gmail.com`, "Test User 5", 30, "Test City", client);
                customer5Id = customer5.id;

                // get an authenticated test user with 'admin' role
                const adminUser = await createAuthenticatedTestUser(client, {role: 'admin'});
                adminId = adminUser.customerId;

                const response = await request(app)
                    .get("/customers")
                    .set("Authorization", `Bearer ${adminUser.jwtToken}`);

                /*
                    This endpoint returns an object in response as:
                    const data = {
                            data: customers,
                            page: req.query.pagination.page,
                            limit: limit,
                            count : customers.length, // this is the number of rows returned by psql, not total rows in db, for that we need to do another query to count total rows in db.
                            total: totalCustomers, // this is the total number of rows in db of customers table
                            totalPages: Math.ceil(totalCustomers / limit) // this is the total number of pages available in db.
                    }

                    // here customers is an array of customer objects, so response.body.data will be an array of customer objects.
                */
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty("data");
                expect(response.body).toHaveProperty("page");
                expect(response.body).toHaveProperty("limit");
                expect(response.body).toHaveProperty("count");
                expect(response.body).toHaveProperty("total");
                expect(response.body).toHaveProperty("totalPages");
                expect(response.body.data).toBeInstanceOf(Array); // db returns array of customers
                expect(response.body.data.length).toBeGreaterThanOrEqual(5); // at least 5 customers should be returned
                // check these are the customers we created
                // extract ids of customers in response.body.data
                const arrayOfReturnedIds = response.body.data.map(function(c){ // this will loop over each customer and extract the id.
                    return c.id;
                })
                // check if these ids are what we created
                expect(arrayOfReturnedIds).toEqual(expect.arrayContaining([customer1Id, customer2Id, customer3Id, customer4Id, customer5Id]));
            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customer1Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer1Id]);
                }
                if (customer2Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer2Id]);
                }
                if (customer3Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer3Id]);
                }
                if (customer4Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer4Id]);
                }
                if (customer5Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer5Id]);
                }
                if (adminId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [adminId]);
                }
                client.release();
            }
        })

        it("should return only 3 customers & sorted in descending order by 'age' when JWT token is valid and role is admin", async function(){
            const client = await pool.connect();
            let adminId;
            let customer1Id, customer2Id, customer3Id, customer4Id, customer5Id;

            try{
                // create 5 customers
                const customer1 = await createCustomer(`testuser1_${Date.now()}@gmail.com`, "Test User 1", 30, "Test City", client);
                customer1Id = customer1.id;
                const customer2 = await createCustomer(`testuser2_${Date.now()}@gmail.com`, "Test User 2", 40, "Test City", client);
                customer2Id = customer2.id;
                const customer3 = await createCustomer(`testuser3_${Date.now()}@gmail.com`, "Test User 3", 50, "Test City", client);
                customer3Id = customer3.id;
                const customer4 = await createCustomer(`testuser4_${Date.now()}@gmail.com`, "Test User 4", 60, "Test City", client);
                customer4Id = customer4.id;
                const customer5 = await createCustomer(`testuser5_${Date.now()}@gmail.com`, "Test User 5", 70, "Test City", client);
                customer5Id = customer5.id;

                // get an authenticated test user with 'admin' role
                const adminUser = await createAuthenticatedTestUser(client, {role: 'admin'});
                adminId = adminUser.customerId;

                const response = await request(app)
                    .get("/customers?sort=age&order=desc&limit=3") // sort by age in descending order and limit to 3 customers
                    .set("Authorization", `Bearer ${adminUser.jwtToken}`);

                /*
                    This endpoint returns an object in response as:
                    const data = {
                            data: customers,
                            page: req.query.pagination.page,
                            limit: limit,
                            count : customers.length, // this is the number of rows returned by psql, not total rows in db, for that we need to do another query to count total rows in db.
                            total: totalCustomers, // this is the total number of rows in db of customers table
                            totalPages: Math.ceil(totalCustomers / limit) // this is the total number of pages available in db.
                    }

                    // here customers is an array of customer objects, so response.body.data will be an array of customer objects.
                */
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty("data");
                expect(response.body).toHaveProperty("page");
                expect(response.body).toHaveProperty("limit");
                expect(response.body).toHaveProperty("count");
                expect(response.body).toHaveProperty("total");
                expect(response.body).toHaveProperty("totalPages");
                expect(response.body.data).toBeInstanceOf(Array); // db returns array of customers
                expect(response.body.data.length).toEqual(3); // at least 5 customers should be returned
                // check these are the customers we created
                // extract ids of customers in response.body.data
                const arrayOfReturnedIds = response.body.data.map(function(c){ // this will loop over each customer and extract the id.
                    return c.id;
                })
                // check if these ids are what we created in the sorted order
                expect(arrayOfReturnedIds).toEqual([ customer5Id, customer4Id, customer3Id]);
            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customer1Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer1Id]);
                }
                if (customer2Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer2Id]);
                }
                if (customer3Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer3Id]);
                }
                if (customer4Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer4Id]);
                }
                if (customer5Id) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customer5Id]);
                }
                if (adminId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [adminId]);
                }
                client.release();
            }
        })

    })

    describe("Unsuccessful retrieval of All customers by admin", function(){
        it("should return 401 unauthorized when Authorization header is missing", async function(){

            const response = await request(app)
                .get("/customers");

            expect(response.status).toBe(401);
        })

        it("should return 401 unauthorized when JWT token is missing", async function(){
            const response = await request(app)
                .get("/customers")
                .set("Authorization", "Bearer "); // empty

            expect(response.status).toBe(401);
        })

        it("should return 401 unauthorized when scheme is not Bearer", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                // get an authenticated test user before making the request
                const adminUser = await createAuthenticatedTestUser(client, {role: 'admin'});
                customerId = adminUser.customerId; // store the created customer id for cleanup
                const response = await request(app)
                    .get("/customers") // any id
                    .set("Authorization", `Basic ${adminUser.jwtToken}`); // <<<=== wrong scheme, should be Bearer

                expect(response.status).toBe(401);

            }finally{
                // Cleanup: Delete test data (CASCADE will delete credentials and refresh_tokens)
                if (customerId) {
                    await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
                }
                client.release();
            }
        })

        it("should return 401 unauthorized when JWT token is incorrect", async function(){
            const response = await request(app)
                .get("/customers")
                .set("Authorization", "Bearer invalid.Bearer.token");

            expect(response.status).toBe(401);
        })

        it("should return 403 forbidden when JWT token is valid but role is not admin", async function(){
            const client = await pool.connect();
            let customerId;
            try{
                // get an authenticated test user but role should NOT BE 'admin'
                const user = await createAuthenticatedTestUser(client); // role is not admin
                customerId = user.customerId; // store the created customer id for cleanup

                const response = await request(app)
                    .get("/customers") // any id
                    .set("Authorization", `Bearer ${user.jwtToken}`); // valid jwt token but role is not admin

                expect(response.status).toBe(403);
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