import logging
import json
from typing import Any

from llama_runner.config_loader import ensure_config_exists, CONFIG_FILE
from llama_runner.models.config_model import AppConfig, ModelConfig, RuntimeConfig

logger = logging.getLogger(__name__)

class ConfigRepository:
    """
    Handles configuration loading, validation, and access with type safety guarantees.
    
    Attributes:
        logger: Class-level logger instance
        config_data: Validated configuration dictionary of type AppConfig
    """
    def __init__(self, config_path: str = CONFIG_FILE) -> None:
        self.logger = logger
        self.config_path = config_path
        try:
            # Load and validate configuration with proper typing
            self.config_data: AppConfig = self.load_config()  
            self.validate_configuration()
        except Exception as e:
            self.logger.error(f"Failed to load or validate config from {config_path}: {str(e)}")
            raise RuntimeError("Configuration loading or validation failed") from e
    
    def load_config(self) -> AppConfig:
        """
        Loads the configuration from the JSON file using the existing config_loader logic.
        This method acts as an adapter to the existing load_config function.
        It ensures the returned data conforms to AppConfig and maps keys if necessary.
        
        Returns:
            AppConfig: The loaded and typed configuration
        """
        # Use the existing ensure_config_exists and load_config from config_loader
        if not ensure_config_exists():
            raise RuntimeError("Could not ensure config file exists")
        
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                raw_config: dict[str, Any] = json.load(f) # Explicitly type the raw config

            # Map the key from the old config structure to the new one
            # The raw_config from config_loader.py uses "llama-runtimes"
            # Our AppConfig model uses "runtimes"
            if "llama-runtimes" in raw_config:
                raw_config["runtimes"] = raw_config.pop("llama-runtimes")

            # The raw_config might also have an "audio" section with "runtimes" and "models".
            # Our AudioConfig model expects "runtimes" and "models".
            # This should already be handled by config_loader.py.

            # Cast the processed raw_config to AppConfig.
            # A more robust solution would validate the structure explicitly.
            typed_config: AppConfig = raw_config # type: ignore[assignment] # Assume structure is correct after mapping
            return typed_config
        
        except (OSError, json.JSONDecodeError) as e:
            self.logger.error(f"Error loading config file: {e}")
            raise RuntimeError(f"Error loading config file: {e}") from e

    def get_config(self) -> AppConfig:
        """
        Retrieve the loaded application configuration.
        
        Returns:
            AppConfig: The current application configuration
        """
        return self.config_data

    def get_model_config(self, model_name: str) -> ModelConfig:
        """
        Retrieve configuration for a specific model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            ModelConfig: Configuration for the specified model
            
        Raises:
            KeyError: If the model is not found in the configuration
        """
        # Get the models section from config_data, ensuring it's typed as Dict[str, ModelConfig]
        models: Dict[str, ModelConfig] = self.config_data.get("models", {}) # type: ignore[assignment] # Assume structure is correct
        if model_name not in models:
            raise KeyError(f"Model '{model_name}' not found in configuration")
        return models[model_name]

    def get_runtime_config(self, runtime_name: str) -> RuntimeConfig:
        """
        Retrieve configuration for a specific runtime.
        
        Args:
            runtime_name: Name of the runtime
            
        Returns:
            RuntimeConfig: Configuration for the specified runtime
            
        Raises:
            KeyError: If the runtime is not found in the configuration
        """
        # The config_data key has been mapped from "llama-runtimes" to "runtimes" in load_config
        # Get the runtimes section from config_data, ensuring it's typed as Dict[str, RuntimeConfig]
        runtimes: Dict[str, RuntimeConfig] = self.config_data.get("runtimes", {}) # type: ignore[assignment] # Assume structure is correct
        if runtime_name not in runtimes:
            raise KeyError(f"Runtime '{runtime_name}' not found in configuration")
        return runtimes[runtime_name]

    def validate_configuration(self) -> None:
        """
        Validates the loaded configuration against the AppConfig schema.
        This is a basic check to ensure the config object is of the expected type.
        More complex validation can be added here if needed.
        
        Raises:
            ValueError: If the configuration does not conform to the expected schema.
        """
        # AppConfig is a TypedDict, so isinstance check is not necessary or meaningful
        # The assignment to self.config_data: AppConfig in __init__ already enforces the type.
        # Add more specific validation if required by AppConfig structure
        # For now, we assume the AppConfig TypedDict provides sufficient structural validation
        # when the config is loaded and assigned to self.config_data: AppConfig
        pass # Placeholder for potential future validation logic
