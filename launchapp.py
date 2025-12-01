#!/usr/bin/env python3
# Launch script for Llama Runner Async Proxy - Simple version

import os
import sys
import subprocess
import platform


def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Set working directory to script location
    os.chdir(script_dir)

    print(f"Launching Llama Runner Async Proxy from {script_dir}")

    # Determine platform and build appropriate command
    if platform.system() == "Windows":
        # Windows - use PowerShell with virtual environment
        venv_path = os.path.join(script_dir, "dev-venv")
        python_exe = os.path.join(venv_path, "Scripts", "python.exe")

        if os.path.exists(python_exe):
            print(f"Starting Llama Runner Async Proxy on Windows...")
            # Run with uvicorn using the virtual environment
            cmd = [
                python_exe,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8081",
            ]
            subprocess.run(cmd)
        else:
            print("Python executable not found in virtual environment")
            sys.exit(1)
    else:
        # Linux/macOS - use bash script with virtual environment
        venv_path = os.path.join(script_dir, "dev-venv")
        python_exe = os.path.join(venv_path, "bin", "python")

        if os.path.exists(python_exe):
            print(f"Starting Llama Runner Async Proxy on {platform.system()}...")
            # Run with uvicorn using the virtual environment
            cmd = [
                python_exe,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host",
                "0.0.0.0",
                "--port",
                "8081",
            ]
            subprocess.run(cmd)
        else:
            print("Python executable not found in virtual environment")
            sys.exit(1)


if __name__ == "__main__":
    main()
