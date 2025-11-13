# app/api/v1/endpoints/status.py

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import time
import psutil
from app.services.backend_service import backend_service

router = APIRouter()


class StatusResponse(BaseModel):
    llamaRunner: bool
    lmStudio: bool
    ollama: bool
    audioService: bool
    system: Dict[str, Any]
    timestamp: float


@router.get("/status", response_model=StatusResponse)
async def get_status():
    # Get system metrics
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()

    # Get status from the backend service
    backend_status = backend_service.get_status()

    return StatusResponse(
        llamaRunner=backend_status["llamaRunner"],
        lmStudio=backend_status["lmStudio"],
        ollama=backend_status["ollama"],
        audioService=backend_status["audioService"],
        system={
            "cpu": cpu_percent,
            "memory": memory.percent,
            "activeModels": backend_status["system"]["activeModels"],
        },
        timestamp=time.time()
    )
