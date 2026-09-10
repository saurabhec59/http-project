import request from 'supertest';
import app from '../../src/core/app.js';
import { createCustomer } from '../../src/repositories/customer-repo.js';
import { createCredentials } from '../../src/repositories/customer-cred-repo.js';
import { hashPassword } from '../../src/auth/hash.js';

/*
Test helper: createAuthenticatedTestUser
It will RETURN:
    created customer details + jwt access token (from login response)

WHY THIS EXISTS:
1.  Many endpoint tests need a customer who is already logged in (a valid JWT)
    before they can even test the endpoint under test (e.g. GET /customers/me).
    Repeating "create customer -> create credentials -> login -> extract jwt"
    in every single test file/case is exactly the kind of boilerplate that
    production test suites extract into a shared "test factory" helper.

2. Unique email per call (timestamp + counter) so parallel/repeated test runs
   never collide on a UNIQUE constraint.
4. Cleanup (DELETE FROM customers) is intentionally NOT done inside this
   helper - the caller already owns a pg client via pool.connect() (as seen
   in existing tests) and is responsible for its own try/finally cleanup.
   A helper silently deleting rows behind the test's back would make test
   failures harder to reason about.
*/

let userCounter = 0;

async function createAuthenticatedTestUser(client, overrides = {}) {
    userCounter += 1;
    const unique = `${Date.now()}_${userCounter}`;
    let customerId = null;

    const userData = {
        email: `test_user_${unique}@example.com`,
        password: "TestPass123",
        name: "Test User",
        age: 30,
        city: "Test City",
        ...overrides
    };

    try{
        const customer = await createCustomer(userData.email, userData.name, userData.age, userData.city, client);
        customerId = customer.id;

        const hashed = hashPassword(userData.password);
        // create credentials
        await createCredentials(customer.id, hashed.hashedPassword, hashed.salt, client);

        const loginResponse = await request(app)
            .post('/auth/login')
            .send({ email: userData.email, password: userData.password });

        if (loginResponse.status !== 200 || !loginResponse.body.jwtToken) { // currently server send jwt token in res body
            throw new Error(
                `createAuthenticatedTestUser: failed to log in test user (status ${loginResponse.status}): ${JSON.stringify(loginResponse.body)}`
            );
        }

        return {
            customerId: customer.id,
            email: userData.email,
            password: userData.password,
            name: userData.name,
            age: userData.age,
            city: userData.city,
            jwtToken: loginResponse.body.jwtToken
        };
    }catch(error){
        // On successful return from this function, the caller will clean up created customer and it's credentials using returned customerId.
        // But if if customer creation throws error or credentials creation throws error or even login fails (like status is not 200 or no token present
        // then also here we will do clean up.
        if(customerId !== null){
            await client.query('DELETE FROM customers WHERE id = $1', [customerId]);
        }
        // RETHROW the error to the caller
        throw error;
    }

}

export { createAuthenticatedTestUser };

