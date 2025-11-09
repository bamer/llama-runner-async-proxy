from typing import Dict, Any
import logging

# Import the load_config function from the config_loader module
from llama_runner.config_loader import load_config
from llama_runner.models.config_model import AppConfig

class ModelConfig:
    """
    Central class for managing application configuration with type validation.
    
    Attributes:
        config: Main configuration dictionary loaded from disk
        logger: Class-level logger instance
    """
    def __init__(self, config_path: str = 'config.yaml') -> None:
        self.logger = logging.getLogger(__name__)
        try:
            # Load and validate configuration with proper typing
            # The load_config function returns AppConfig
            raw_config: AppConfig = load_config()  # load_config takes no arguments
            self.config: Dict[str, Any] = dict(raw_config)  # Convert TypedDict to regular dict
            self.validate_configuration()
        except Exception as e:
            self.logger.error(f"Failed to load config from {config_path}: {str(e)}")
            raise RuntimeError("Configuration loading failed")
    
    def validate_configuration(self) -> None:
        """
        Validate that all required configuration parameters are present and properly typed.
        Raise ValueError if validation fails
        """
        # Add comprehensive config validation logic here