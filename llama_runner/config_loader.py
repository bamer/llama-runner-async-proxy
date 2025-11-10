"""
Configuration loader module with both functional and class-based interfaces.
Provides utilities for loading, validating, and managing configuration files.
Supports separated application and models configuration with backward compatibility.
"""

import json
import shutil
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import datetime
import logging
import psutil
import socket
import platform
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Définition claire du répertoire de configuration
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / "config"
APP_CONFIG_FILE = CONFIG_DIR / "app_config.json"
MODELS_CONFIG_FILE = CONFIG_DIR / "models_config.json"
LEGACY_CONFIG_FILE = CONFIG_DIR / "config.json"  # Pour la rétrocompatibilité

# Créer le répertoire de configuration s'il n'existe pas
if not CONFIG_DIR.exists():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    logging.info(f"✅ Created config directory at {CONFIG_DIR}")

def ensure_config_exists() -> Tuple[bool, str]:
    """
    Ensure both configuration files exist, creating them with default values if necessary.
    Also maintains backward compatibility with legacy config.json.
    
    Returns:
        Tuple[bool, str]: (success, message) indicating the result
    """
    try:
        # Check if legacy config exists and migrate if needed
        if LEGACY_CONFIG_FILE.exists() and not APP_CONFIG_FILE.exists() and not MODELS_CONFIG_FILE.exists():
            logging.info("🔄 Migrating legacy config.json to new format...")
            migrate_legacy_config()
        
        # Ensure app config exists
        if not APP_CONFIG_FILE.exists():
            logging.warning(f"⚠️  Application config file not found at {APP_CONFIG_FILE}")
            logging.info("   Creating default application configuration...")
            default_app_config = _create_default_app_config_dict()
            
            # Write the default app configuration
            with open(APP_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_app_config, f, indent=4, ensure_ascii=False)
            
            logging.info(f"✅ Created default application configuration at {APP_CONFIG_FILE}")
        
        # Ensure models config exists
        if not MODELS_CONFIG_FILE.exists():
            logging.warning(f"⚠️  Models config file not found at {MODELS_CONFIG_FILE}")
            logging.info("   Creating default models configuration...")
            default_models_config = _create_default_models_config_dict()
            
            # Write the default models configuration
            with open(MODELS_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_models_config, f, indent=4, ensure_ascii=False)
            
            logging.info(f"✅ Created default models configuration at {MODELS_CONFIG_FILE}")
        
        return True, "Both configuration files exist"
    except Exception as e:
        logging.error(f"❌ Error ensuring configs exist: {e}")
        return False, str(e)

def migrate_legacy_config():
    """Migrate legacy config.json to the new split format."""
    try:
        with open(LEGACY_CONFIG_FILE, 'r', encoding='utf-8') as f:
            legacy_config = json.load(f)
        
        # Split into app and models config
        app_config = {}
        models_config = {}
        
        # Application config parts
        app_keys = ['proxies', 'webui', 'metrics', 'audio', 'concurrentRunners', 'logging', 'runtimes']
        for key in app_keys:
            if key in legacy_config:
                app_config[key] = legacy_config[key]
        
        # Models config parts
        models_keys = ['default_parameters', 'models', 'default_model']
        for key in models_keys:
            if key in legacy_config:
                models_config[key] = legacy_config[key]
        
        # Create default parameters if not exists
        if 'default_parameters' not in models_config:
            models_config['default_parameters'] = _create_default_models_config_dict()['default_parameters']
        
        # Save the split configs
        with open(APP_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(app_config, f, indent=4, ensure_ascii=False)
        
        with open(MODELS_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(models_config, f, indent=4, ensure_ascii=False)
        
        logging.info("✅ Successfully migrated legacy config to new format")
        logging.info("💡 Backup created: config/config.json.backup")
        shutil.copy2(LEGACY_CONFIG_FILE, LEGACY_CONFIG_FILE.with_suffix('.json.backup'))
        
    except Exception as e:
        logging.error(f"❌ Error migrating legacy config: {e}")

def load_app_config() -> Dict[str, Any]:
    """
    Load the application configuration from the app config file.
    
    Returns:
        Dict[str, Any]: The loaded application configuration dictionary
    """
    try:
        # Ensure config exists first
        success, message = ensure_config_exists()
        if not success:
            logging.warning(f"⚠️  Falling back to default app configuration: {message}")
            return _create_default_app_config_dict()
        
        # Load the application configuration
        with open(APP_CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Validate and fix the configuration
        config = _validate_and_fix_app_config(config)
        return config
        
    except Exception as e:
        logging.error(f"❌ Error loading application configuration: {e}")
        logging.info("   Falling back to default application configuration")
        return _create_default_app_config_dict()

def load_models_config() -> Dict[str, Any]:
    """
    Load the models configuration from the models config file.
    
    Returns:
        Dict[str, Any]: The loaded models configuration dictionary
    """
    try:
        # Ensure config exists first
        success, message = ensure_config_exists()
        if not success:
            logging.warning(f"⚠️  Falling back to default models configuration: {message}")
            return _create_default_models_config_dict()
        
        # Load the models configuration
        with open(MODELS_CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Validate and fix the configuration
        config = _validate_and_fix_models_config(config)
        return config
        
    except Exception as e:
        logging.error(f"❌ Error loading models configuration: {e}")
        logging.info("   Falling back to default models configuration")
        return _create_default_models_config_dict()

def load_combined_config() -> Dict[str, Any]:
    """
    Load and combine both application and models configurations.
    This maintains backward compatibility with existing code that expects a single config.
    
    Returns:
        Dict[str, Any]: Combined configuration dictionary
    """
    app_config = load_app_config()
    models_config = load_models_config()
    
    # Merge the configurations
    combined_config = {**app_config, **models_config}
    
    # Add models section from models_config if it exists
    if "models" in models_config:
        combined_config["models"] = models_config["models"]
    
    # Add default_model from models_config if it exists
    if "default_model" in models_config:
        combined_config["default_model"] = models_config["default_model"]
    
    return combined_config

# 🔥 RÉTROCOMPATIBILITÉ : Maintenir load_config() pour les anciens appels
def load_config() -> Dict[str, Any]:
    """
    BACKWARD COMPATIBILITY FUNCTION
    Load the combined configuration to maintain compatibility with existing code.
    
    Returns:
        Dict[str, Any]: Combined configuration dictionary
    """
    logging.warning("⚠️  Using deprecated load_config() function. Please update to load_app_config() and load_models_config().")
    return load_combined_config()

def get_model_config_with_defaults(model_name: str) -> Dict[str, Any]:
    """
    Get a model configuration with default parameters applied.
    This is the key function for the new architecture that supports parameter inheritance.
    
    Args:
        model_name: Name of the model to get configuration for
    
    Returns:
        Dict[str, Any]: Complete model configuration with defaults applied
    """
    models_config = load_models_config()
    
    # Get default parameters
    default_params = models_config.get("default_parameters", {})
    runtimes = models_config.get("runtimes", {})
    
    # Get model-specific configuration
    models = models_config.get("models", {})
    model_config = models.get(model_name, {})
    
    if not model_config:
        logging.warning(f"⚠️  Model '{model_name}' not found in configuration")
        return {}
    
    # Get model-specific parameters and merge with defaults
    model_params = model_config.get("parameters", {})
    final_params = {**default_params, **model_params}
    
    # Get runtime configuration
    runtime_name = model_config.get("llama_cpp_runtime", "llama-server")
    runtime_config = runtimes.get(runtime_name, {})
    
    return {
        "model_path": model_config.get("model_path"),
        "llama_cpp_runtime": runtime_name,
        "runtime_config": runtime_config,
        "parameters": final_params,
        "display_name": model_config.get("display_name", model_name),
        "auto_discovered": model_config.get("auto_discovered", False),
        "auto_update_model": model_config.get("auto_update_model", False),
        "has_tools": model_config.get("has_tools", False)
    }

def discover_and_add_models(model_directory: str = "..\\llama\\models", auto_save: bool = True) -> Tuple[int, int]:
    """
    Discover GGUF model files in the specified directory and add them to the configuration.
    Preserves existing model parameters and only adds new models.
    
    Args:
        model_directory: Relative path to the models directory
        auto_save: Whether to automatically save the updated configuration
    
    Returns:
        Tuple[int, int]: (new_models_added, existing_models_preserved)
    """
    try:
        logging.info(f"🔍 Discovering models in directory: {model_directory}")
        
        # Get current models config
        models_config = load_models_config()
        existing_models = models_config.get("models", {})
        default_parameters = models_config.get("default_parameters", {})
        runtimes = models_config.get("runtimes", {})
        
        # Resolve the absolute path
        base_dir = Path(__file__).parent.parent
        abs_model_dir = base_dir / model_directory
        
        logging.info(f"📂 Scanning absolute path: {abs_model_dir}")
        
        if not abs_model_dir.exists():
            logging.warning(f"⚠️  Models directory does not exist: {abs_model_dir}")
            return 0, 0
        
        # Find all .gguf files
        gguf_files = list(abs_model_dir.glob("*.gguf"))
        logging.info(f"🎯 Found {len(gguf_files)} GGUF files")
        
        new_models_added = 0
        existing_models_preserved = 0
        
        for gguf_file in gguf_files:
            # Extract model name from filename (remove .gguf extension)
            model_filename = gguf_file.name
            model_name = model_filename.replace('.gguf', '')
            
            logging.info(f"📋 Processing model: {model_name}")
            
            # Check if model already exists
            if model_name in existing_models:
                logging.info(f"✅ Model '{model_name}' already exists - preserving existing configuration")
                existing_models_preserved += 1
                continue
            
            # Create new model configuration with default parameters
            relative_model_path = f"{model_directory}\\{model_filename}"
            
            new_model_config = {
                "model_path": relative_model_path,
                "llama_cpp_runtime": "llama-server",
                "parameters": {
                    "n_gpu_layers": 45,  # Default value
                    "ctx_size": default_parameters.get("ctx_size", 32000),
                    "temp": default_parameters.get("temp", 0.7)
                },
                "display_name": model_name,
                "auto_discovered": True,
                "auto_update_model": False,
                "has_tools": False
            }
            
            # Add to models config
            if "models" not in models_config:
                models_config["models"] = {}
            
            models_config["models"][model_name] = new_model_config
            new_models_added += 1
            logging.info(f"✨ Added new model: {model_name} with path: {relative_model_path}")
        
        # Set default model if none exists
        if not models_config.get("default_model") and new_models_added > 0:
            first_model = next(iter(models_config["models"]))
            models_config["default_model"] = first_model
            logging.info(f"🎯 Set default model to: {first_model}")
        
        # Save if requested
        if auto_save and (new_models_added > 0):
            with open(MODELS_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(models_config, f, indent=4, ensure_ascii=False)
            logging.info(f"✅ Saved updated models configuration with {new_models_added} new models")
        
        return new_models_added, existing_models_preserved
        
    except Exception as e:
        logging.error(f"❌ Error discovering models: {e}")
        return 0, 0

def _create_backup(config_path: Path) -> Path:
    """Create a backup of the configuration file."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = config_path.parent / f"config_backup_{timestamp}.json"
    shutil.copy2(config_path, backup_path)
    return backup_path

def _create_default_app_config_dict() -> Dict[str, Any]:
    """Create and return the default application configuration dictionary."""
    return {
        "proxies": {
            "ollama": {
                "enabled": True,
                "port": 11434
            },
            "lmstudio": {
                "enabled": True,
                "port": 1234,
                "api_key": None
            }
        },
        "webui": {
            "enabled": True,
            "port": 8081,
            "host": "0.0.0.0"
        },
        "metrics": {
            "enabled": True,
            "port": 8080,
            "host": "0.0.0.0"
        },
        "audio": {
            "models": {
                "whisper-tiny": {
                    "model_path": "tiny",
                    "parameters": {
                        "device": "cpu",
                        "compute_type": "int8",
                        "threads": 4,
                        "language": None,
                        "beam_size": 5
                    }
                }
            }
        },
        "concurrentRunners": 1,
        "logging": {
            "prompt_logging_enabled": False
        }
    }

def _create_default_models_config_dict() -> Dict[str, Any]:
    """Create and return the default models configuration dictionary."""
    return {
        "default_parameters": {
            "ctx_size": 32000,
            "temp": 0.7,
            "batch_size": 1024,
            "ubatch_size": 512,
            "threads": 10,
            "mlock": True,
            "no_mmap": True,
            "flash_attn": "on",
            "port": 8035,
            "host": "127.0.0.1"
        },
        "runtimes": {
            "llama-server": {
                "runtime": "..\\llama\\llama-server.exe",
                "supports_tools": True
            }
        },
        "models": {
            "JanusCoderV-7B.i1-Q4_K_S": {
                "model_path": "..\\llama\\models\\JanusCoderV-7B.i1-Q4_K_S.gguf",
                "llama_cpp_runtime": "llama-server",
                "parameters": {
                    "n_gpu_layers": 85,
                    "jinja": True,
                    "port": 8035
                },
                "display_name": "JanusCoderV-7B.i1-Q4_K_S",
                "auto_discovered": False,
                "auto_update_model": False,
                "has_tools": True
            }
        },
        "default_model": "JanusCoderV-7B.i1-Q4_K_S"
    }

def _validate_and_fix_app_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and fix application configuration issues."""
    # Ensure proxies section exists
    if "proxies" not in config:
        config["proxies"] = _create_default_app_config_dict()["proxies"]
        logging.warning("⚠️  Created missing 'proxies' section in application configuration")
    
    # Ensure webui section exists
    if "webui" not in config:
        config["webui"] = _create_default_app_config_dict()["webui"]
        logging.warning("⚠️  Created missing 'webui' section in application configuration")
    
    return config

def _validate_and_fix_models_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and fix models configuration issues."""
    # Ensure default_parameters exists
    if "default_parameters" not in config:
        config["default_parameters"] = _create_default_models_config_dict()["default_parameters"]
        logging.warning("⚠️  Created missing 'default_parameters' section in models configuration")
    
    # Ensure models section exists
    if "models" not in config:
        config["models"] = _create_default_models_config_dict()["models"]
        logging.warning("⚠️  Created missing 'models' section in models configuration")
    
    # Ensure default_model exists
    if "default_model" not in config:
        config["default_model"] = "JanusCoderV-7B.i1-Q4_K_S"
        logging.warning("⚠️  Added missing 'default_model' to models configuration")
    
    # Ensure default model exists in models
    if config["default_model"] not in config["models"]:
        if config["models"]:
            # Use first available model
            config["default_model"] = next(iter(config["models"]))
            logging.warning(f"⚠️  Default model not found, using first available: {config['default_model']}")
        else:
            # Create default model
            config["models"] = _create_default_models_config_dict()["models"]
            config["default_model"] = "JanusCoderV-7B.i1-Q4_K_S"
            logging.warning("⚠️  No models configured, using default model configuration")
    
    return config

def calculate_system_fingerprint(model_config: Dict[str, Any]) -> str:
    """
    Calculate a system fingerprint based on hardware and configuration.
    This helps identify the specific system and configuration that generated a response.
    
    Args:
        model_config: The model configuration dictionary
    
    Returns:
        str: A unique fingerprint string
    """
    try:
        # Collect system information
        cpu_count = psutil.cpu_count(logical=False) or psutil.cpu_count(logical=True)
        cpu_freq = psutil.cpu_freq().current if hasattr(psutil, 'cpu_freq') else 0
        cpu_info = f"{cpu_count} cores @ {cpu_freq:.1f} MHz" if cpu_freq else f"{cpu_count} cores"
        
        total_memory_gb = psutil.virtual_memory().total / (1024**3)
        memory_info = f"{total_memory_gb:.1f} GB RAM"
        gpu_info = "GPU info not available"
        
        # Try to get GPU info if available
        try:
            import pynvml
            pynvml.nvmlInit()
            device_count = pynvml.nvmlDeviceGetCount()
            if device_count > 0:
                handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                gpu_name = pynvml.nvmlDeviceGetName(handle)
                if isinstance(gpu_name, bytes):
                    gpu_name = gpu_name.decode()
                memory_info_gpu = pynvml.nvmlDeviceGetMemoryInfo(handle)
                gpu_memory_gb = memory_info_gpu.total / (1024**3)
                gpu_info = f"{gpu_name} ({gpu_memory_gb:.1f} GB VRAM)"
                pynvml.nvmlShutdown()
        except (ImportError, Exception) as e:
            logging.debug(f"GPU info not available: {e}")
        
        # Network and platform info
        hostname = socket.gethostname()
        platform_info = f"{platform.system()} {platform.release()} ({platform.architecture()[0]})"
        
        # Model-specific configuration
        model_name = model_config.get('display_name', 'unknown_model')
        n_gpu_layers = model_config.get('parameters', {}).get('n_gpu_layers', 0)
        ctx_size = model_config.get('parameters', {}).get('ctx_size', 0)
        
        # Create a unique string combining all this information
        fingerprint_data = f"{hostname}:{platform_info}:{cpu_info}:{memory_info}:{gpu_info}:{model_name}:{n_gpu_layers}:{ctx_size}"
        
        # Hash it to create a compact fingerprint
        fingerprint_hash = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:12]
        
        return f"fp_{fingerprint_hash}"
    
    except Exception as e:
        logging.warning(f"Error calculating system fingerprint: {e}")
        return "fp_unknown"

class ConfigLoader:
    """
    Class-based configuration loader for more complex use cases.
    Maintains backward compatibility with existing code.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the config loader.
        
        Args:
            config_path: Path to config file, defaults to APP_CONFIG_FILE
        """
        self.config_path = config_path or str(APP_CONFIG_FILE)
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration using the combined interface."""
        return load_combined_config()
    
    def get_config(self) -> Dict[str, Any]:
        """Get the loaded configuration."""
        return self.config
    
    def save_config(self, config: Dict[str, Any]):
        """
        Save configuration to file.
        This method needs to be updated to handle the split configuration.
        
        Args:
            config: Configuration dictionary to save
        """
        try:
            # Create backup first
            backup_path = _create_backup(Path(self.config_path))
            logging.info(f"✅ Created backup before save: {backup_path}")
            
            # Save the configuration
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
            
            logging.info(f"✅ Configuration saved to {self.config_path}")
            self.config = config
        except Exception as e:
            logging.error(f"❌ Error saving configuration: {e}")
            raise

# Create global instances for backward compatibility
config_loader = ConfigLoader()
config = config_loader.get_config()

if __name__ == "__main__":
    # Simple test
    logging.info("Testing configuration loader...")
    test_app_config = load_app_config()
    test_models_config = load_models_config()
    test_combined_config = load_combined_config()
    
    logging.info(f"Loaded application configuration")
    logging.info(f"Loaded models configuration with {len(test_models_config.get('models', {}))} models")
    logging.info(f"Default model: {test_models_config.get('default_model')}")
    
    # Test model config with defaults
    default_model = test_models_config.get('default_model', 'JanusCoderV-7B.i1-Q4_K_S')
    test_model_config = get_model_config_with_defaults(default_model)
    logging.info(f"Test model config with defaults: {test_model_config.get('display_name')}")
    
    # Test model discovery
    new_models, preserved = discover_and_add_models()
    logging.info(f"Model discovery results: {new_models} new models added, {preserved} existing models preserved")
    
    logging.info("✅ Configuration loader test passed")