// Jest Setup File
// This file runs ONCE before any test file is loaded
// It configures the environment for all tests

// Override PGDATABASE to use the test database
// This ensures that when src/db/connection.js creates its pool,
// it connects to the test database instead of the production database
process.env.PGDATABASE = process.env.PGTESTDATABASE || 'http_project_test';