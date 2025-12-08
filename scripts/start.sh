#!/bin/bash

# Start both frontend and backend services
echo "Starting Llama Runner Async Proxy system..."

# Install dependencies for both frontend and backend
echo "Installing frontend dependencies..."
npm --prefix frontend install
echo "Installing backend dependencies..."
npm --prefix backend install

# Start backend server
echo "Starting backend server..."
npm --prefix backend start &

# Wait a moment before starting frontend
sleep 2

# Start frontend development server
echo "Starting frontend development server..."
npm --prefix frontend run dev

