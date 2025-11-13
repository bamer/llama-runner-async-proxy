# app/utils/config.py
# This module adapts the logic from llama_runner/config_loader.py
# to fit the new FastAPI structure.

import json
from pathlib import Path
from typing import Any, Dict
import os

CONFIG_DIR = Path(__file__).parent.parent.parent / "config"
APP_CONFIG_FILE = CONFIG_DIR / "app_config.json"
MODELS_CONFIG_FILE = CONFIG_DIR / "models_config.json"


def ensure_directories_exist() -> bool:
    """Creates necessary directories like config and logs."""
    try:
        CONFIG_DIR.mkdir(exist_ok=True)
        logs_dir = Path(__file__).parent.parent.parent / "logs"
        logs_dir.mkdir(exist_ok=True)
        return True
    except Exception as e:
        print(f"Error creating directories: {e}")
        return False


def load_app_config_safe() -> Dict[str, Any]:
    """Loads the main application configuration."""
    ensure_directories_exist()
    if not APP_CONFIG_FILE.exists():
        print(f"App config file not found: {APP_CONFIG_FILE}, creating default.")
        default_config = create_default_app_config()
        save_config(APP_CONFIG_FILE, default_config)
        return default_config

    try:
        with open(APP_CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except json.JSONDecodeError as e:
        print(f"Error parsing app config JSON: {e}")
        return create_default_app_config()


def load_models_config_safe() -> Dict[str, Any]:
    """Loads the models configuration."""
    ensure_directories_exist()
    if not MODELS_CONFIG_FILE.exists():
        print(f"Models config file not found: {MODELS_CONFIG_FILE}, creating default.")
        default_config = create_default_models_config()
        save_config(MODELS_CONFIG_FILE, default_config)
        return default_config

    try:
        with open(MODELS_CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except json.JSONDecodeError as e:
        print(f"Error parsing models config JSON: {e}")
        return create_default_models_config()


def create_default_app_config() -> Dict[str, Any]:
    return {
        "proxies": {
            "ollama": {"enabled": True, "port": 11434},
            "lmstudio": {"enabled": True, "port": 1234, "api_key": None}
        },
        "webui": {"enabled": True, "port": 8081, "host": "0.0.0.0"},
        "concurrentRunners": 1,
        "logging": {"prompt_logging_enabled": False}
    }

def create_default_models_config() -> Dict[str, Any]:
    return {
        "default_parameters": {
            "ctx_size": 32000,
            "temp": 0.7,
            "port": 8000,
            "host": "127.0.0.1"
        },
        "runtimes": {
            "llama-server": {
                "runtime": "F:/llm/llama/llama-server.exe",
                "supports_tools": True
            }
        },
        "models": {},
        "default_model": None
    }

def save_config(config_path: Path, config: Dict[str, Any]) -> bool:
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving config to {config_path}: {e}")
        return False

# Example usage if needed elsewhere
# app_config = load_app_config_safe()
# models_config = load_models_config_safe()
