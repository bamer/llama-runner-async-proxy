import uvicorn
import os
from app.main import app

# Get the config to determine port
from llama_runner.config_loader import load_config

app_config = load_config()
port = app_config.get("webui", {}).get("port", 8081)

if __name__ == "__main__":
    print(f"Starting FastAPI app on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
