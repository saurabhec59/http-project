import {pool} from '../../src/db/connection.js';
import {createCustomer, findCustomerByEmail, getCustomerById, getAllCustomers, getAllCustomersCount, updateCustomer, deleteCustomer} from '../../src/repositories/customer-repo.js';

/*
Integration Tests for customer-repo.js

These tests verify that repository functions correctly interact with the REAL PostgreSQL database.
Unlike unit tests (which mock dependencies), integration tests use actual database connections.

Test Pattern:
1. Get a client from the test pool
2. BEGIN transaction
3. Perform operations (create, read, update, delete)
4. Assert results
5. ROLLBACK transaction (keeps test database clean)
6. Release client back to pool

Why ROLLBACK?
- No test data is permanently stored in database
- Database stays clean after every test run
- Tests can run in any order (no dependencies)
- Tests can run in parallel safely
*/

describe("customer-repo.js - Integration Tests", function(){

    describe("createCustomer", function(){
        it("should create a new customer and return customer object", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const result = await createCustomer("test@example.com", "Test User", 25, "Test City", client);

                // Assert customer was created
                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.email).toBe("test@example.com");
                expect(result.name).toBe("Test User");
                expect(result.age).toBe(25);
                expect(result.city).toBe("Test City");
                expect(result.role).toBe(null); // role is nullable and not set during creation

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        /*it("should create customer with nullable fields (age, city)", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const result = await createCustomer("nullable@example.com", "Nullable User", null, null, client);

                expect(result.email).toBe("nullable@example.com");
                expect(result.name).toBe("Nullable User");
                expect(result.age).toBe(null);
                expect(result.city).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should auto-increment id for multiple customers", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const customer1 = await createCustomer("user1@example.com", "User 1", 20, "City 1", client);
                const customer2 = await createCustomer("user2@example.com", "User 2", 30, "City 2", client);

                expect(customer2.id).toBeGreaterThan(customer1.id);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })*/
    })

    describe("findCustomerByEmail", function(){
        it("should find customer by email when exists", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Create customer first
                const created = await createCustomer("find@example.com", "Find User", 28, "Find City", client);

                // Now find by email
                const found = await findCustomerByEmail("find@example.com", client);

                expect(found).toBeDefined();
                expect(found.id).toBe(created.id);
                expect(found.email).toBe("find@example.com");
                expect(found.name).toBe("Find User");
                expect(found.age).toBe(28);
                expect(found.city).toBe("Find City");

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return null when customer with email does not exist", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const result = await findCustomerByEmail("nonexistent@example.com", client);

                expect(result).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should find correct customer among multiple customers", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                await createCustomer("user1@example.com", "User 1", 20, "City 1", client);
                const target = await createCustomer("user2@example.com", "User 2", 30, "City 2", client);
                await createCustomer("user3@example.com", "User 3", 40, "City 3", client);

                const found = await findCustomerByEmail("user2@example.com", client);

                expect(found.id).toBe(target.id);
                expect(found.email).toBe("user2@example.com");
                expect(found.name).toBe("User 2");

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

    describe("getCustomerById", function(){
        it("should find customer by id when exists", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const created = await createCustomer("getid@example.com", "Get User", 35, "Get City", client);

                const found = await getCustomerById(created.id, client);

                expect(found).toBeDefined();
                expect(found.id).toBe(created.id);
                expect(found.email).toBe("getid@example.com");
                expect(found.name).toBe("Get User");
                expect(found.age).toBe(35);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return null when customer with id does not exist", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const result = await getCustomerById(999999, client);

                expect(result).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

    describe("getAllCustomers", function(){
        it("should return empty array when no customers exist", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const result = await getAllCustomers("id", "asc", 10, 0, client);

                expect(result).toEqual([]);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return all customers with correct sorting", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                await createCustomer("alice@example.com", "Alice", 30, "City A", client);
                await createCustomer("bob@example.com", "Bob", 25, "City B", client);
                await createCustomer("charlie@example.com", "Charlie", 35, "City C", client);

                const result = await getAllCustomers("name", "asc", 10, 0, client);

                expect(result.length).toBe(3);
                expect(result[0].name).toBe("Alice");
                expect(result[1].name).toBe("Bob");
                expect(result[2].name).toBe("Charlie");

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return customers sorted by age descending", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                await createCustomer("user1@example.com", "User 1", 30, "City", client);
                await createCustomer("user2@example.com", "User 2", 50, "City", client);
                await createCustomer("user3@example.com", "User 3", 20, "City", client);

                const result = await getAllCustomers("age", "desc", 10, 0, client);

                expect(result[0].age).toBe(50);
                expect(result[1].age).toBe(30);
                expect(result[2].age).toBe(20);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should respect limit parameter", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                await createCustomer("user1@example.com", "User 1", 20, "City", client);
                await createCustomer("user2@example.com", "User 2", 30, "City", client);
                await createCustomer("user3@example.com", "User 3", 40, "City", client);
                await createCustomer("user4@example.com", "User 4", 50, "City", client);

                const result = await getAllCustomers("id", "asc", 2, 0, client);

                expect(result.length).toBe(2);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should respect offset parameter (pagination)", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const c1 = await createCustomer("user1@example.com", "User 1", 20, "City", client);
                const c2 = await createCustomer("user2@example.com", "User 2", 30, "City", client);
                const c3 = await createCustomer("user3@example.com", "User 3", 40, "City", client);

                // Skip first 1, get next 2
                const result = await getAllCustomers("id", "asc", 2, 1, client);

                expect(result.length).toBe(2);
                expect(result[0].id).toBe(c2.id);
                expect(result[1].id).toBe(c3.id);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

    describe("getAllCustomersCount", function(){
        it("should return 0 when no customers exist", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const count = await getAllCustomersCount(client);

                expect(count).toBe(0);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return correct count of customers", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                await createCustomer("user1@example.com", "User 1", 20, "City", client);
                await createCustomer("user2@example.com", "User 2", 30, "City", client);
                await createCustomer("user3@example.com", "User 3", 40, "City", client);

                const count = await getAllCustomersCount(client);

                expect(count).toBe(3);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

    describe("updateCustomer", function(){
        it("should update customer details and return updated customer", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // create customer first
                const created = await createCustomer("update@example.com", "Original Name", 25, "Original City", client);

                const updated = await updateCustomer(created.id, "newemail@example.com", "Updated Name", 30, "Updated City", client);

                expect(updated).toBeDefined();
                expect(updated.id).toBe(created.id);
                expect(updated.email).toBe("newemail@example.com");
                expect(updated.name).toBe("Updated Name");
                expect(updated.age).toBe(30);
                expect(updated.city).toBe("Updated City");

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return null when customer to update does not exist", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const result = await updateCustomer(999999, "email@example.com", "Name", 25, "City", client);

                expect(result).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should persist changes when queried again", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const created = await createCustomer("persist@example.com", "Old Name", 20, "Old City", client);
                await updateCustomer(created.id, "persist@example.com", "New Name", 25, "New City", client);

                const fetched = await getCustomerById(created.id, client);

                expect(fetched.name).toBe("New Name");
                expect(fetched.age).toBe(25);
                expect(fetched.city).toBe("New City");

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

    describe("deleteCustomer", function(){
        it("should delete customer and return rowCount of 1", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // create customer first
                const created = await createCustomer("delete@example.com", "Delete User", 30, "Delete City", client);

                const rowCount = await deleteCustomer(created.id, client);

                expect(rowCount).toBe(1);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should return rowCount of 0 when customer does not exist", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                const rowCount = await deleteCustomer(999999, client);

                expect(rowCount).toBe(0);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })

        it("should not find customer after deletion", async function(){
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // create customer first
                const created = await createCustomer("deletefind@example.com", "Delete Find User", 35, "City", client);
                await deleteCustomer(created.id, client);

                const found = await getCustomerById(created.id, client);

                expect(found).toBe(null);

                await client.query('ROLLBACK');
            } finally {
                client.release();
            }
        })
    })

})