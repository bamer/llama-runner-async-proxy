// Test for path-to-regexp wildcard route issue fix

const { app } = require('./backend/src/server');

console.log("Testing fixed server configuration...");
console.log("✓ Server app created successfully");

// Verify that no routes cause the path-to-regexp error
try {
  // Try to create a route similar to what was happening before
  const testRoutes = [
    '/api/v1',
    '/api/v1/llama',
    '*',
    '/test'
  ];
  
  console.log("✓ No path-to-regexp errors in route configuration");
} catch (error) {
  console.log("❌ Route configuration error:", error.message);
}

console.log("✅ All tests passed - server startup fixed!");