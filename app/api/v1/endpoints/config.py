from fastapi import APIRouter, Depends, HTTPException
from typing import Dict

from app.main import app

router = APIRouter(prefix="/config")

# Helper to get manager from app state

def get_manager():
    return app.state.manager

@router.get("/{model_name}", summary="Get model configuration")
async def get_model_config(model_name: str):
    manager = get_manager()
    config = manager.models_specific_config.get(model_name)
    if config is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return config

@router.post("/{model_name}", summary="Update model configuration")
async def update_model_config(model_name: str, payload: Dict):
    manager = get_manager()
    if model_name not in manager.models_specific_config:
        raise HTTPException(status_code=404, detail="Model not found")
    # Merge new config into existing
    manager.models_specific_config[model_name].update(payload)
    return {"status": "updated", "model": model_name}
