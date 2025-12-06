"""
Compatibility layer for config imports.
This file provides the expected symbols for proxy_manager.py and other modules.
"""

from .config_loader import load_config, load_models_config_safe as load_models_config

# Provide the config object as a module-level variable
config = load_config()

# Provide config_loader as a module (though not strictly needed, some code expects it)
import sys
from . import config_loader
sys.modules[__name__ + '.config_loader'] = config_loader

__all__ = ['config', 'config_loader', 'load_config', 'load_models_config']