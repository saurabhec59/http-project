import pg from 'pg';

/*
Integration Test Database Configuration

This file creates a separate database connection pool for integration tests.
The test database (server1_test) has the SAME SCHEMA as the dev database (server1)
but contains NO production data.

Each integration test will:
1. BEGIN a transaction
2. Run the test (insert/update/delete/select)
3. ROLLBACK the transaction

This way, no test data is permanently stored in the test database.
The database remains clean after every test run.
*/

const testPool = new pg.Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: 'server1_test', // TEST DATABASE
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
})

export { testPool };