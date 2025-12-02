#!/bin/bash

# Update script for Node.js refactored application
echo "Updating Llama Runner Async Proxy to Node.js implementation"

# Ensure dependencies are installed
cd /home/bamer/llama-runner-async-proxy
npm install

# Create necessary directories
mkdir -p backend/src
mkdir -p frontend/src
mkdir -p config

# Copy configuration files to new location
cp config/app_config.json backend/config/
cp config/models_config.json backend/config/

echo "Node.js refactored application updated successfully"
echo "To run:"
echo "npm start" 
echo "or"
echo "npm run dev" 
