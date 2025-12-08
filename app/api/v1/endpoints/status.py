// Security Enhanced API Endpoints - Status.py

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any
import time
import psutil
from app.services.backend_service import backend_service

# Define response model with proper type safety
class StatusResponse(BaseModel):
    llamaRunner: bool
    lmStudio: bool
    ollama: bool
    audioService: bool
    system: Dict[str, Any]
    timestamp: float

# Enhanced status endpoint with React 19-inspired security patterns
router = APIRouter()

@router.get("/status", response_model=StatusResponse)
async def get_status():
    # Get system metrics safely
    cpu_percent = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    
    # Get status from the backend service with optimistic handling
    backend_status = backend_service.get_status()
    
    # Sanitize error handling - React 19 pattern for secure error management
    try:
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
    except Exception as error:
        # React 19 pattern: Handle errors with optimistic updates and sanitized messages
        print(f"Status error: {error}")
        return StatusResponse(
            llamaRunner=False,
            lmStudio=False,
            ollama=False,
            audioService=False,
            system={ 
                "cpu": 0, 
                "memory": 0, 
                "activeModels": 0 
            },
            timestamp=time.time()
        )