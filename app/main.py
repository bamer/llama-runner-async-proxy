# app/main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import HTMLResponse
import uvicorn
import os

from app.api.v1.routers import api_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

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
