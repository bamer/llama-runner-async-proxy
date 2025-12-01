# app/api/v1/endpoints/models.py
import sys

sys.path.insert(0, "/home/bamer/llama-runner-async-proxy")

from fastapi import APIRouter
from llama_runner.config_loader import load_models_config
from typing import List, Dict, Any

router = APIRouter()


@router.get("/models")
async def list_models():
    """Return a list of available models from configuration."""
    # Load the models configuration
    models_config = load_models_config()

    # Extract model information from config
    models_list = []
    if isinstance(models_config, dict):
        # Check for models section in the config
        models_section = models_config.get("models", {})

        # If it's a list of models, process directly
        if isinstance(models_section, list):
            for model in models_section:
                if isinstance(model, dict) and "name" in model:
                    models_list.append(
                        {
                            "name": model["name"],
                            "port": model.get("port", 8081),
                            "status": "running"
                            if model.get("active", False)
                            else "stopped",
                        }
                    )
        # If it's a dictionary of named models, process
        elif isinstance(models_section, dict):
            for model_name, model_config in models_section.items():
                if isinstance(model_config, dict):
                    models_list.append(
                        {
                            "name": model_name,
                            "port": model_config.get("port", 8081),
                            "status": "running"
                            if model_config.get("active", False)
                            else "stopped",
                        }
                    )

    return {"models": models_list}
