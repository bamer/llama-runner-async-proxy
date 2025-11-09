"""
Configuration loader module with both functional and class-based interfaces.
Provides utilities for loading, validating, and managing configuration files.
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
CONFIG_FILE = CONFIG_DIR / "config.json"

# Créer le répertoire de configuration s'il n'existe pas
if not CONFIG_DIR.exists():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    logging.info(f"✅ Created config directory at {CONFIG_DIR}")

def ensure_config_exists() -> Tuple[bool, str]:
    """
    Ensure the configuration file exists, creating it with default values if necessary.
    
    Returns:
        Tuple[bool, str]: (success, message) indicating the result
    """
    try:
        if not CONFIG_FILE.exists():
            logging.warning(f"⚠️  Configuration file not found at {CONFIG_FILE}")
            logging.info("   Creating default configuration...")
            default_config = _create_default_config_dict()
            
            # Write the default configuration
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=4, ensure_ascii=False)
            
            logging.info(f"✅ Created default configuration at {CONFIG_FILE}")
            return True, f"Default configuration created at {CONFIG_FILE}"
        return True, f"Configuration file exists at {CONFIG_FILE}"
    except Exception as e:
        logging.error(f"❌ Error ensuring config exists: {e}")
        return False, str(e)

def load_config() -> Dict[str, Any]:
    """
    Load the configuration from the config file, creating defaults if necessary.
    
    Returns:
        Dict[str, Any]: The loaded configuration dictionary
    """
    try:
        # Ensure config exists first
        success, message = ensure_config_exists()
        if not success:
            logging.warning(f"⚠️  Falling back to default configuration: {message}")
            return _create_default_config_dict()
        
        # Load the configuration
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Validate and fix the configuration
        config = _validate_and_fix_config(config)
        return config
        
    except Exception as e:
        logging.error(f"❌ Error loading configuration: {e}")
        logging.info("   Falling back to default configuration")
        default_config = _create_default_config_dict()
        
        # Save the default config as backup
        try:
            backup_path = _create_backup(CONFIG_FILE)
            logging.info(f"✅ Created backup at {backup_path}")
        except Exception as backup_error:
            logging.warning(f"⚠️  Could not create backup: {backup_error}")
        
        return default_config

def _create_backup(config_path: Path) -> Path:
    """Create a backup of the configuration file."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = config_path.parent / f"config_backup_{timestamp}.json"
    shutil.copy2(config_path, backup_path)
    return backup_path

def _create_default_config_dict() -> Dict[str, Any]:
    """Create and return the default configuration dictionary."""
    return {
        "default_model": "JanusCoderV-7B.i1-Q4_K_S",
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
        "models": {
            "JanusCoderV-7B.i1-Q4_K_S": {
                "model_path": "models/JanusCoderV-7B.i1-Q4_K_S.gguf",
                "llama_cpp_runtime": "llama-server",
                "parameters": {
                    "ctx_size": 32000,
                    "temp": 0.7,
                    "batch_size": 1024,
                    "ubatch_size": 512,
                    "threads": 10,
                    "mlock": True,
                    "no_mmap": True,
                    "flash_attn": "on",
                    "n_gpu_layers": 85,
                    "jinja": True,
                    "port": 8035,
                    "host": "127.0.0.1"
                },
                "display_name": "JanusCoderV-7B.i1-Q4_K_S",
                "auto_discovered": False,
                "auto_update_model": False
            }
        },
        "default_runtime": "llama-server",
        "concurrentRunners": 1,
        "logging": {
            "prompt_logging_enabled": False
        },
        "runtimes": {
            "llama-server": {
                "runtime": "tools/llama-server.exe",
                "supports_tools": True
            }
        }
    }

def _validate_and_fix_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and fix configuration issues."""
    # Ensure default_model exists
    if "default_model" not in config:
        config["default_model"] = "JanusCoderV-7B.i1-Q4_K_S"
        logging.warning("⚠️  Added missing 'default_model' to configuration")
    
    # Ensure models section exists
    if "models" not in config:
        config["models"] = {}
        logging.warning("⚠️  Created missing 'models' section in configuration")
    
    # Ensure default model exists in models
    if config["default_model"] not in config["models"]:
        if config["models"]:
            # Use first available model
            config["default_model"] = next(iter(config["models"]))
            logging.warning(f"⚠️  Default model not found, using first available: {config['default_model']}")
        else:
            # Create default model
            config["models"] = _create_default_config_dict()["models"]
            config["default_model"] = "JanusCoderV-7B.i1-Q4_K_S"
            logging.warning("⚠️  No models configured, using default model configuration")
    
    # Fix model paths to be relative
    for model_name, model_config in config["models"].items():
        if "model_path" in model_config:
            # Convert absolute paths to relative
            if "F:\\llm\\llama\\models\\" in model_config["model_path"]:
                model_config["model_path"] = model_config["model_path"].replace("F:\\llm\\llama\\models\\", "models/")
                logging.info(f"✅ Fixed model path for {model_name}: {model_config['model_path']}")
    
    # Fix runtime paths to be relative
    if "runtimes" in config:
        for runtime_name, runtime_config in config.get("runtimes", {}).items():
            if "runtime" in runtime_config:
                # Convert absolute paths to relative
                if "F:\\llm\\llama\\" in runtime_config["runtime"]:
                    runtime_config["runtime"] = runtime_config["runtime"].replace("F:\\llm\\llama\\", "tools/")
                    logging.info(f"✅ Fixed runtime path for {runtime_name}: {runtime_config['runtime']}")
    
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
            config_path: Path to config file, defaults to CONFIG_FILE
        """
        self.config_path = config_path or str(CONFIG_FILE)
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration using the functional interface."""
        return load_config()
    
    def get_config(self) -> Dict[str, Any]:
        """Get the loaded configuration."""
        return self.config
    
    def save_config(self, config: Dict[str, Any]):
        """
        Save configuration to file.
        
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
    test_config = load_config()
    logging.info(f"Loaded configuration with {len(test_config.get('models', {}))} models")
    logging.info(f"Default model: {test_config.get('default_model')}")
    logging.info("✅ Configuration loader test passed")