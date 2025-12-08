// Test file for reproducing the path-to-regexp issue
const express = require('express');
const app = express();

// Reproduce the problematic route setup
app.get('/*', (req, res) => {
  res.send('Test');
});

console.log("Testing app setup...");
try {
  // This should fail with the PathError mentioned in the issue
  const server = app.listen(3000);
  console.log("App started successfully");
} catch (error) {
  console.log("Error:", error.message);
}