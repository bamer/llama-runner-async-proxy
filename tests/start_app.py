import sys
import asyncio
from llama_runner.main import main

if __name__ == "__main__":
    sys.argv = ["main.py", "--headless", "--log-level", "DEBUG", "--skip-validation"]
    asyncio.run(main())