#!/bin/bash
# Launch script for Llama Runner Async Proxy - Debug Version

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to script directory
cd "$SCRIPT_DIR"

echo "=== Starting Llama Runner Async Proxy ==="
echo "Directory: $SCRIPT_DIR"

# Check if dev-venv exists
if [ ! -d "./dev-venv" ]; then
    echo "ERROR: Virtual environment directory 'dev-venv' not found!"
    echo "Please run: python -m venv dev-venv"
    exit 1
fi

# Check if virtual environment Python exists
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows platform
    PYTHON_PATH="./dev-venv/Scripts/python.exe"
    echo "Windows detected - Using: $PYTHON_PATH"
else
    # Linux platform
    PYTHON_PATH="./dev-venv/bin/python"
    echo "Linux/macOS detected - Using: $PYTHON_PATH"
fi

if [ ! -f "$PYTHON_PATH" ]; then
    echo "ERROR: Python executable not found at $PYTHON_PATH"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p "./logs"

echo "Starting FastAPI server on port 8081 with debug logging..."
echo "This will show the server startup and then remain running."

# Start with debug mode
"$PYTHON_PATH" app/main.py --host 0.0.0.0 --port 8081 --log-level debug

echo "=== Llama Runner Async Proxy stopped ==="