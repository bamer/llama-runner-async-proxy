# run_fastapi_app.py
# Entry point to run the new FastAPI application

import uvicorn
from app.main import app
from app.core.config import settings

if __name__ == "__main__":
    print(f"Starting FastAPI app on {settings.HOST}:{settings.PORT}")
    uvicorn.run(app, host=settings.HOST, port=settings.PORT, reload=settings.RELOAD)
