from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from fastapi.requests import Request

router = APIRouter(prefix="/config")

# Dependency that retrieves the manager from FastAPI app state via request object
from fastapi import Depends


def get_manager_dep():
    def _dep(request: Request):
        return request.app.state.manager
    return Depends(_dep)

@router.get("/{model_name}", summary="Get model configuration")
def get_model_config(request: Request, model_name: str):
    manager = request.app.state.manager
    config = manager.models_specific_config.get(model_name)
    if config is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return config

@router.post("/{model_name}", summary="Update model configuration")
async def update_model_config(model_name: str, payload: Dict, manager=Depends(get_manager_dep())):
    if model_name not in manager.models_specific_config:
        raise HTTPException(status_code=404, detail="Model not found")
    manager.models_specific_config[model_name].update(payload)
    return {"status": "updated", "model": model_name}
