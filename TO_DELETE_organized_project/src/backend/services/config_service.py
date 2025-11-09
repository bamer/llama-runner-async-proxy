"""
Configuration Service

Handles configuration management with separation of concerns:
- Load/save configuration files
- Environment variable resolution
- Configuration validation
- Default configuration handling
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ConfigService:
    """Service for managing application configuration"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config_path = Path(config_path)
        self.config: Dict[str, Any] = {}
    
    async def load_config(self) -> Dict[str, Any]:
        """Load configuration from file with fallback to defaults"""
        try:
            if not self.config_path.exists():
                logger.warning(f"Config file not found: {self.config_path}")
                self.config = self._get_default_config()
                return self.config
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            
            # Apply environment variable resolution
            self._resolve_env_vars()
            
            logger.info(f"✅ Configuration loaded from {self.config_path}")
            return self.config
            
        except Exception as e:
            logger.error(f"❌ Failed to load config: {e}")
            self.config = self._get_default_config()
            return self.config
    
    def _resolve_env_vars(self) -> None:
        """Resolve environment variables in configuration"""
        def resolve_value(value):
            if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                env_key = value[2:-1]
                return os.getenv(env_key, value)
            elif isinstance(value, dict):
                return {k: resolve_value(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [resolve_value(v) for v in value]
            return value
        
        self.config = resolve_value(self.config)  # type: ignore
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration with all required sections"""
        return {
            "models": {},
            "llama-runtimes": {
                "default": {
                    "runtime": "llama-server"
                }
            },
            "concurrentRunners": 1,
            "proxies": {
                "ollama": {"enabled": True},
                "lmstudio": {"enabled": True}
            },
            "ports": {
                "lm_studio": 1234,
                "ollama": 11434,
                "metrics": 8080,
                "webui": 8081
            },
            "logging": {
                "level": "INFO",
                "file": "llamarunner.log"
            }
        }
    
    def save_config(self) -> bool:
        """Save current configuration to file"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Configuration saved to {self.config_path}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save config: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value using dot notation"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any) -> None:
        """Set configuration value using dot notation"""
        keys = key.split('.')
        config_ref = self.config
        
        for k in keys[:-1]:
            if k not in config_ref:
                config_ref[k] = {}
            config_ref = config_ref[k]
        
        config_ref[keys[-1]] = value
    
    def validate_config(self) -> Dict[str, Any]:
        """Validate configuration and return validation results"""
        errors = []
        warnings = []
        
        # Check required sections
        required_sections = ['models', 'llama-runtimes']
        for section in required_sections:
            if section not in self.config:
                errors.append(f"Missing required section: {section}")
        
        # Check models
        if 'models' in self.config:
            models = self.config['models']
            if not models:
                warnings.append("No models configured")
            else:
                for model_name, model_config in models.items():
                    if 'model_path' not in model_config:
                        errors.append(f"Model '{model_name}' missing model_path")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
