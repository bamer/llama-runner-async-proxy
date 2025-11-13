# app/api/v1/routers.py

from fastapi import APIRouter
from app.api.v1.endpoints import status, health, models, config, monitoring

api_router = APIRouter()
api_router.include_router(status.router, tags=["status"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(models.router, tags=["models"])
api_router.include_router(config.router, tags=["config"])
api_router.include_router(monitoring.router, tags=["monitoring"])
