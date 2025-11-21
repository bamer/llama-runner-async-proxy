# app/api/v1/endpoints/health.py

from fastapi import APIRouter
from datetime import datetime
from app.models.common import HealthResponse

router = APIRouter()

# Global start time for uptime calculation
_start_time = datetime.utcnow()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    uptime = (datetime.utcnow() - _start_time).total_seconds()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        uptime=uptime
    )
