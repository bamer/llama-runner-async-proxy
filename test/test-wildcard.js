const express = require('express');
const app = express();

// Test various route patterns
console.log("Testing different route patterns...");

try {
  // This is what we want to fix - proper way to handle wildcard routes in express
  app.get('*', (req, res) => {
    res.send('Wildcard route works');
  });
  
  console.log("✓ Wildcard route created successfully");
} catch (error) {
  console.log("✗ Error:", error.message);
}

try {
  // Alternative method - use a specific path first then catch-all
  app.get('/api/v1/*', (req, res) => {
    res.send('API wildcard');
  });
  
  console.log("✓ API wildcard route created successfully");
} catch (error) {
  console.log("✗ API Error:", error.message);
}

console.log("App setup completed");