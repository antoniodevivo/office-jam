// Shared test setup for API tests
// Set test environment variables
process.env.ENCRYPTION_KEY = "0".repeat(64); // 32 bytes hex for testing
process.env.NODE_ENV = "test";
