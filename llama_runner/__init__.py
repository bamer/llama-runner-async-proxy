"""
Package initialization for llama_runner.
Provides clean imports without circular dependencies.
"""

# Import only the most fundamental components that don't create circular dependencies
from .config_loader import load_config, CONFIG_DIR, config_loader, config

# For GUI components, import them lazily or through specific modules
# This avoids circular imports during package initialization

__all__ = [
    "load_config",
    "CONFIG_DIR",
    "config_loader",
    "config"
]