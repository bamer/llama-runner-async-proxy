#!/bin/bash
# Launch script for Llama Runner Async Proxy - Final Working Version

echo "=== Starting Llama Runner Async Proxy ==="
echo "This will start the FastAPI server on port 8081."

# Ensure we're in correct directory
cd /home/bamer/llama-runner-async-proxy

# Start the server using run_fastapi_app.py which properly starts the main FastAPI server
./dev-venv/bin/python run_fastapi_app.py

echo "=== Llama Runner Async Proxy stopped ==="