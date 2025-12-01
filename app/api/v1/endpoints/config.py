from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from fastapi.requests import Request

router = APIRouter(prefix="/config")

def get_manager(request: Request):
    # Retrieve the manager stored in FastAPI's state object.
    return request.app.state.manager


@router.get("/{model_name}", summary="Get model configuration")
async def get_model_config(
        request: Request,
        model_name: str
) -> dict:
    manager = request.app.state.manager
    config = manager.models_specific_config.get(model_name)
    if not config:
        raise HTTPException(status_code=404, detail="Model not found")
    return config


@router.post("/{model_name}", summary="Update model configuration")
async def update_model_config(
        model_name: str,
        payload: Dict,
        request: Request,
) -> dict:
    if model_name not in manager.models_specific_config:
        raise HTTPException(status_code=404, detail="Model not found")

    # Update the existing config dictionary
    manager.models_specific_config[model_name].update(payload)
    return {"status": "updated", "model": model_name}
