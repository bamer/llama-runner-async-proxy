#!/bin/bash

# Build the complete system
echo "Building Llama Runner Async Proxy system..."

# Install dependencies for both frontend and backend
echo "Installing dependencies..."
npm --prefix frontend install
npm --prefix backend install

# Build frontend
echo "Building frontend..."
npm --prefix frontend build

# Build backend (if needed)
echo "Building backend..."
npm --prefix backend run build

echo "Build complete!"
