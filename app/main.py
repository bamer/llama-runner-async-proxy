# app/main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn
import os

from app.api.v1.routers import api_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# Load core configuration and create headless manager
from llama_runner.config_loader import load_config, load_models_config
from llama_runner.headless_service_manager import HeadlessServiceManager
import asyncio

# Initialise manager
app_config = load_config()
models_config = load_models_config()
manager = HeadlessServiceManager(app_config, models_config)
# Expose in app state for routes
app.state.manager = manager

# Start services on startup
@app.on_event("startup")
async def _startup():
    # Start services asynchronously
    asyncio.create_task(manager.start_services())

# Gracefully stop on shutdown
@app.on_event("shutdown")
async def _shutdown():
    await manager.stop_services()

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Serve static files and HTML if needed
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_path, "static")), name="static")

    @app.get("/", response_class=HTMLResponse)
    async def serve_spa():
        with open(os.path.join(frontend_path, "index.html")) as f:
            return HTMLResponse(f.read())

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.RELOAD)


