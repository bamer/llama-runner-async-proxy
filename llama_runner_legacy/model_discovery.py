"""
Model discovery module - automatically discovers GGUF models from the models directory.
"""

import os
from pathlib import Path
from typing import Dict, Any
import logging

from llama_runner_legacy.constants import (
    MODELS_ROOT_ABSOLUTE_PATH,
    LLAMA_SERVER_ABSOLUTE_PATH
)

def discover_models_from_directory(models_dir: str = MODELS_ROOT_ABSOLUTE_PATH) -> Dict[str, Any]:
    """
    Discovers GGUF models from the models directory and returns a models configuration dict.
    
    Args:
        models_dir: Path to the models directory (default: F:\\llm\\llama\\models)
        
    Returns:
        Dict[str, Any]: Models configuration compatible with models_config.json format
    """
    logging.info(f"🔍 Discovering models from directory: {models_dir}")
    
    if not os.path.exists(models_dir):
        logging.error(f"❌ Models directory does not exist: {models_dir}")
        return {}
    
    models_config = {}
    models_path = Path(models_dir)
    
    # First, find all .gguf files at the root level
    root_gguf_files = list(models_path.glob("*.gguf"))
    for model_file in root_gguf_files:
        model_name = model_file.stem  # Remove .gguf extension
        
        # Create model config entry
        models_config[model_name] = {
            "model_path": str(model_file),
            "llama_cpp_runtime": "llama-server",
            "parameters": {
                "n_gpu_layers": 85,  # Default value, can be adjusted per model later
                "port": 8000 + len(models_config)  # Unique port per model
            },
            "display_name": model_name,
            "auto_discovered": True,
            "auto_update_model": False,
            "has_tools": False
        }
        
        logging.info(f"✅ Discovered root model: {model_name} at {model_file}")
    
    # Then, iterate through all subdirectories
    for model_dir in models_path.iterdir():
        if not model_dir.is_dir():
            continue
            
        logging.info(f"🔍 Checking model directory: {model_dir.name}")
        
        # Find all .gguf files in the directory
        gguf_files = list(model_dir.glob("*.gguf"))
        
        if not gguf_files:
            logging.warning(f"⚠️ No .gguf files found in {model_dir}")
            continue
            
        # Take the first .gguf file (or handle multiple if needed)
        model_file = gguf_files[0]
        model_name = model_file.stem  # Remove .gguf extension
        
        # Avoid duplicate model names
        if model_name in models_config:
            model_name = f"{model_name}_{model_dir.name}"
            logging.warning(f"⚠️ Duplicate model name detected. Using: {model_name}")
        
        # Create model config entry
        models_config[model_name] = {
            "model_path": str(model_file),
            "llama_cpp_runtime": "llama-server",
            "parameters": {
                "n_gpu_layers": 85,  # Default value, can be adjusted per model later
                "port": 8000 + len(models_config)  # Unique port per model
            },
            "display_name": model_name,
            "auto_discovered": True,
            "auto_update_model": False,
            "has_tools": False
        }
        
        logging.info(f"✅ Discovered model from directory: {model_name} at {model_file}")
    
    logging.info(f"✅ Discovered {len(models_config)} models")
    return models_config

def update_models_config_with_discovered_models(existing_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates an existing models config with newly discovered models.
    Preserves manual configurations and only adds new auto-discovered models.
    
    Args:
        existing_config: Existing models configuration
        
    Returns:
        Updated models configuration
    """
    discovered_models = discover_models_from_directory()
    
    # Preserve existing models and their configurations
    updated_config = existing_config.copy()
    
    # Add new models that are not already in the config
    for model_name, model_config in discovered_models.items():
        if model_name not in updated_config.get("models", {}):
            if "models" not in updated_config:
                updated_config["models"] = {}
            updated_config["models"][model_name] = model_config
            logging.info(f"➕ Added new discovered model: {model_name}")
        else:
            # Update auto_discovered flag if it was manually added before
            if updated_config["models"][model_name].get("auto_discovered", False) != model_config["auto_discovered"]:
                updated_config["models"][model_name]["auto_discovered"] = model_config["auto_discovered"]
                logging.info(f"🔄 Updated auto_discovered flag for model: {model_name}")
    
    # Ensure runtime configuration exists
    if "runtimes" not in updated_config:
        updated_config["runtimes"] = {
            "llama-server": {
                "runtime": LLAMA_SERVER_ABSOLUTE_PATH,
                "supports_tools": True
            }
        }
    
    return updated_config