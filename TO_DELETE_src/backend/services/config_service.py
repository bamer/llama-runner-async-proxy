import os
import json
import logging
from pathlib import Path
from typing import Any, Dict, TypedDict, cast
from llama_runner.models.config_model import AppConfig, RuntimeConfig
class ModelDiscoveryConfig(TypedDict, total=False):
    enabled: bool
    base_path: str
    auto_update: bool

CONFIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "config")
CONFIG_FILE = os.path.join(CONFIG_DIR, "app_config.json")
# LOG_FILE = os.path.join(CONFIG_DIR, "error.log") # Removed LOG_FILE constant

# Ensure the log directory exists
if not os.path.exists(CONFIG_DIR):
    os.makedirs(CONFIG_DIR, exist_ok=True)

# Removed local logging.basicConfig call. Logging is configured globally in main.py.
# logging.basicConfig(filename=LOG_FILE, level=logging.ERROR, # LOG_FILE constant was removed
#                     format='%(asctime)s - %(levelname)s - %(message)s')



def ensure_config_exists():
    """
    Ensures that the configuration directory and file exist.
    Creates them if they don't.
    """
    if not os.path.exists(CONFIG_DIR):
        try:
            os.makedirs(CONFIG_DIR)
        except OSError as e:
            print(f"Error creating config directory: {e}")
            logging.error(f"Error creating config directory: {e}")
            return False

    if not os.path.exists(CONFIG_FILE):
        try:
            default_config: AppConfig = {
                "models": {},
                "runtimes": {},
                "default_runtime": "llama-server",
                "concurrentRunners": 1,
                "proxies": {
                    "ollama": {"enabled": True, "api_key": None},
                    "lmstudio": {"enabled": True, "api_key": None}
                },
                "logging": {"prompt_logging_enabled": False}
            }
            with open(CONFIG_FILE, "w") as f:
                json.dump(default_config, f, indent=2)
        except OSError as e:
            print(f"Error creating config file: {e}")
            logging.error(f"Error creating config file: {e}")
            return False
    return True

def merge_parameters(global_params: dict[str, Any], model_params: dict[str, Any]) -> dict[str, Any]:
    """
    Merge global parameters with model-specific parameters.
    Model-specific parameters override global ones.
    """
    if not global_params:
        return model_params or {}
    if not model_params:
        return global_params.copy()
    
    merged = global_params.copy()
    merged.update(model_params)
    return merged

def discover_models_from_directory(base_path: str, auto_update: bool = True) -> Dict[str, Any]:
    """
    Discover GGUF models from directory structure and return model configuration.
    Optimized to avoid blocking startup with small timeouts and limits.
    """
    if not auto_update or not os.path.exists(base_path):
        return {}
    
    models: Dict[str, Any] = {}
    base_path_obj = Path(base_path)
    
    # Quick existence check first to avoid expensive iteration if path doesn't exist
    if not base_path_obj.exists():
        return {}
    
    # Limit directory scanning to avoid blocking startup
    try:
        # Use a timeout-based approach for large directories
        # Quick scan - only scan up to 50 directories to avoid blocking
        max_dirs_to_scan = 50
        dirs_scanned = 0
        
        for model_dir in base_path_obj.iterdir():
            if dirs_scanned >= max_dirs_to_scan:
                logging.debug(f"Model discovery: limit of {max_dirs_to_scan} directories reached, stopping scan")
                break
                
            dirs_scanned += 1
            
            if model_dir.is_dir():
                try:
                    # Use a timeout for each glob operation to avoid hanging
                    gguf_files = list(model_dir.glob("*.gguf"))
                    if gguf_files:
                        # Use the first .gguf file found
                        model_file = gguf_files[0]
                        model_name = model_dir.name
                        
                        # Try to extract display name from directory name
                        # Remove quantization suffixes for cleaner display
                        display_name = model_name
                        quant_suffixes = ['Q4_K_S', 'Q4_K_M', 'Q5_K_M', 'Q8_0', 'IQ4_XS', 'BF16', 'F16']
                        for suffix in quant_suffixes:
                            if model_name.endswith(f"-{suffix}") or model_name.endswith(f"_{suffix}"):
                                display_name = model_name.rsplit('-', 1)[0] if '-' in model_name else model_name.rsplit('_', 1)[0]
                                break
                        
                        models[model_name] = {
                            "model_path": str(model_file),
                            "display_name": display_name,
                            "auto_discovered": True
                        }
                except (PermissionError, OSError) as e:
                    # Skip directories we can't read
                    logging.debug(f"Skipping directory {model_dir.name} due to access error: {e}")
                    continue
    except (OSError, PermissionError) as e:
        # Log but don't block if we can't access the directory
        logging.warning(f"Model discovery failed: {e}")
        return {}
    
    logging.info(f"Model discovery: found {len(models)} models from {dirs_scanned} directories")
    return models

def load_config() -> AppConfig:
    """
    Loads the configuration from the JSON file.
    Returns a dictionary containing the configuration.
    """
    if not ensure_config_exists():
        return cast(AppConfig, {})

    try:
        with open(CONFIG_FILE, "r") as f:
            config: Dict[str, Any] = json.load(f)

            # Ensure default_runtime and concurrentRunners exist
            if "default_runtime" not in config:
                config["default_runtime"] = "llama-server"
            if "concurrentRunners" not in config:
                config["concurrentRunners"] = 1

            # Handle global model parameters
            global_model_params: Dict[str, Any] = config.get("global_model_parameters", {})
            
            # Ensure proxies section and its sub-keys exist with defaults
            proxies_config = config.get("proxies", {})
            if not isinstance(proxies_config, dict):
                proxies_config = {}

            ollama_proxy_config = proxies_config.get("ollama", {})  # type: ignore
            if not isinstance(ollama_proxy_config, dict):
                ollama_proxy_config = {}
            if "enabled" not in ollama_proxy_config:
                ollama_proxy_config["enabled"] = True
            proxies_config["ollama"] = ollama_proxy_config

            lmstudio_proxy_config = proxies_config.get("lmstudio", {})  # type: ignore
            if not isinstance(lmstudio_proxy_config, dict):
                lmstudio_proxy_config = {}
            if "enabled" not in lmstudio_proxy_config:
                lmstudio_proxy_config["enabled"] = True
            if "api_key" not in lmstudio_proxy_config:
                lmstudio_proxy_config["api_key"] = None
            proxies_config["lmstudio"] = lmstudio_proxy_config
            
            config["proxies"] = proxies_config

            # Ensure logging section and its sub-keys exist with defaults
            logging_config = config.get("logging", {})
            if not isinstance(logging_config, dict):
                logging_config = {}
            if "prompt_logging_enabled" not in logging_config:
                logging_config["prompt_logging_enabled"] = False
            config["logging"] = logging_config
            
            # Auto-discover models if configured
            model_discovery: Dict[str, Any] = config.get("model_discovery", {})
            if model_discovery.get("enabled", False):
                base_path = model_discovery.get("base_path")
                auto_update = model_discovery.get("auto_update", True)
                if base_path:
                    discovered_models = discover_models_from_directory(base_path, auto_update)
                    
                    # Merge with existing models, preserving manual configurations
                    existing_models = config.get("models", {})
                    merged_models = {}
                    
                    # Add discovered models
                    for model_name, model_info in discovered_models.items():
                        if model_name in existing_models:
                            # Preserve existing configuration, only update path if needed
                            existing_info = existing_models[model_name]
                            merged_models[model_name] = existing_info
                            # Update model_path if file still exists
                            if os.path.exists(model_info["model_path"]):
                                merged_models[model_name]["model_path"] = model_info["model_path"]
                        else:
                            # New discovered model
                            merged_models[model_name] = model_info
                    
                    # Add existing models that weren't discovered (might be in different locations)
                    for model_name, model_info in existing_models.items():
                        if model_name not in merged_models:
                            merged_models[model_name] = model_info
                    
                    config["models"] = merged_models

            # Process llama-runtimes to normalize structure
            raw_runtimes = config.get("llama-runtimes")
            if isinstance(raw_runtimes, dict):
                processed_runtimes: Dict[str, RuntimeConfig] = {}
                for name, details in raw_runtimes.items():
                    if isinstance(details, str):
                        if details.strip():
                            processed_runtimes[name] = {
                                "runtime": details,
                                "supports_tools": True
                            }
                        else:
                            logging.warning(f"Config: Runtime entry '{name}' (old format) has an empty command. Skipping.")
                            print(f"Warning: Config: Runtime entry '{name}' (old format) has an empty command. Skipping.")
                    if isinstance(details, dict):
                        runtime_cmd_raw = details.get("runtime")  # type: ignore
                        runtime_cmd: str = runtime_cmd_raw if isinstance(runtime_cmd_raw, str) else ""
                        if runtime_cmd.strip():
                            supports_tools = details.get("supports_tools", True)  # type: ignore
                            processed_runtimes[name] = {
                                "runtime": runtime_cmd,
                                "supports_tools": supports_tools
                            }
                        else:
                            logging.warning(f"Config: Runtime entry '{name}' has an invalid or empty 'runtime' command value. Skipping.")
                            print(f"Warning: Config: Runtime entry '{name}' has an invalid or empty 'runtime' command value. Skipping.")
                    else:
                        logging.warning(f"Config: Runtime entry '{name}' in 'llama-runtimes' has invalid format (expected string or dict). Skipping.")
                        print(f"Warning: Config: Runtime entry '{name}' in 'llama-runtimes' has invalid format. Skipping.")
                config["runtimes"] = processed_runtimes
            elif raw_runtimes is not None:
                logging.warning("Config: 'llama-runtimes' key exists but is not a dictionary. Ignoring.")
                print("Warning: Config: 'llama-runtimes' key exists but is not a dictionary. Ignoring.")

            # Process models to merge global parameters
            raw_models: Dict[str, Any] | None = config.get("models")
            if isinstance(raw_models, dict):
                processed_models = {}
                for model_name, model_info in raw_models.items():
                    if isinstance(model_info, dict):
                        model_path_raw = model_info.get("model_path")  # type: ignore
                        model_path: str | None = model_path_raw if isinstance(model_path_raw, str) else None
                        runtime_raw = model_info.get("llama_cpp_runtime")  # type: ignore
                        runtime: str = runtime_raw if isinstance(runtime_raw, str) else cast(str, config.get("default_runtime", "llama-server"))
                        parameters_raw = model_info.get("parameters")  # type: ignore
                        parameters: Dict[str, Any] = parameters_raw if isinstance(parameters_raw, dict) else {}  # type: ignore[assignment]
                        display_name_raw = model_info.get("display_name")  # type: ignore
                        display_name: str = display_name_raw if isinstance(display_name_raw, str) else model_name
                        auto_discovered_raw = model_info.get("auto_discovered")  # type: ignore
                        auto_discovered: bool = auto_discovered_raw if isinstance(auto_discovered_raw, bool) else False
                        auto_update_model_raw = model_info.get("auto_update_model")  # type: ignore
                        auto_update_model: bool = auto_update_model_raw if isinstance(auto_update_model_raw, bool) else False
                        
                        if isinstance(model_path, str) and model_path.strip():
                            # Merge global parameters with model-specific ones
                            final_parameters = merge_parameters(global_model_params, parameters)
                            
                            processed_models[model_name] = {
                                "model_path": model_path.strip(),
                                "llama_cpp_runtime": runtime,
                                "parameters": final_parameters,
                                "display_name": display_name,
                                "auto_discovered": auto_discovered,
                                "auto_update_model": auto_update_model
                            }
                        else:
                            logging.warning(f"Config: Model '{model_name}' has invalid or empty 'model_path'. Skipping.")
                            print(f"Warning: Config: Model '{model_name}' has invalid or empty 'model_path'. Skipping.")
                    else:
                        logging.warning(f"Config: Model entry '{model_name}' is not a dictionary. Skipping.")
                        print(f"Warning: Config: Model entry '{model_name}' is not a dictionary. Skipping.")
                config["models"] = processed_models
            elif raw_models is not None:
                logging.warning("Config: 'models' exists but is not a dictionary. Ignoring.")
                print("Warning: Config: 'models' exists but is not a dictionary. Ignoring.")

            raw_audio: Dict[str, Any] | None = config.get("audio")
            if isinstance(raw_audio, dict):
                # Process runtimes
                raw_runtimes: Dict[str, Any] | None = raw_audio.get("runtimes")
                processed_runtimes: Dict[str, RuntimeConfig] = {}
                if isinstance(raw_runtimes, dict):
                    for name, details in raw_runtimes.items():
                        if isinstance(details, dict):
                            runtime_path = details.get("runtime")  # type: ignore
                            if isinstance(runtime_path, str) and runtime_path.strip():
                                processed_runtimes[name] = {
                                    "runtime": runtime_path.strip(),
                                    "supports_tools": False  # Audio runtimes typically don't support tools
                                }
                            else:
                                logging.warning(f"Config: Audio runtime '{name}' has invalid or empty 'runtime' path. Skipping.")
                                print(f"Warning: Config: Audio runtime '{name}' has invalid or empty 'runtime' path. Skipping.")
                        else:
                            logging.warning(f"Config: Audio runtime '{name}' details should be a dictionary. Skipping.")
                            print(f"Warning: Config: Audio runtime '{name}' details should be a dictionary. Skipping.")
                elif raw_runtimes is not None:
                    logging.warning("Config: 'audio.runtimes' exists but is not a dictionary. Ignoring.")
                    print("Warning: Config: 'audio.runtimes' exists but is not a dictionary. Ignoring.")

                # Process models
                raw_models: Dict[str, Any] | None = raw_audio.get("models")
                processed_models = {}
                if isinstance(raw_models, dict):
                    for model_name, model_info in raw_models.items():
                        if isinstance(model_info, dict):
                            model_path = model_info.get("model_path")  # type: ignore
                            runtime = model_info.get("runtime")  # type: ignore
                            parameters = model_info.get("parameters", {})  # type: ignore
                            if isinstance(model_path, str) and model_path.strip():
                                if isinstance(parameters, dict):
                                    processed_models[model_name] = {
                                        "model_path": model_path.strip(),
                                        "runtime": runtime,
                                        "parameters": parameters
                                    }
                                else:
                                    logging.warning(f"Config: Parameters for model '{model_name}' should be a dictionary. Using empty dict instead.")
                                    print(f"Warning: Config: Parameters for model '{model_name}' should be a dictionary. Using empty dict instead.")
                                    processed_models[model_name] = {
                                        "model_path": model_path.strip(),
                                        "runtime": runtime,
                                        "parameters": {}
                                    }
                            else:
                                logging.warning(f"Config: Model '{model_name}' has invalid or empty 'model_path'. Skipping.")
                                print(f"Warning: Config: Model '{model_name}' has invalid or empty 'model_path'. Skipping.")
                        else:
                            logging.warning(f"Config: Model entry '{model_name}' is not a dictionary. Skipping.")
                            print(f"Warning: Config: Model entry '{model_name}' is not a dictionary. Skipping.")
                elif raw_models is not None:
                    logging.warning("Config: 'audio.models' exists but is not a dictionary. Ignoring.")
                    print("Warning: Config: 'audio.models' exists but is not a dictionary. Ignoring.")

                # Update the audio section in config
                config["audio"] = {
                    "runtimes": processed_runtimes,
                    "models": processed_models
                }

            elif raw_audio is not None:
                logging.warning("Config: 'audio' key exists but is not a dictionary. Ignoring.")
                print("Warning: Config: 'audio' key exists but is not a dictionary. Ignoring.")

            
            print(f"Loaded config (processed): {config}")
            return cast(AppConfig, config)
    except (OSError, json.JSONDecodeError) as e:
        print(f"Error loading config file: {e}")
        logging.error(f"Error loading config file: {e}")
        return cast(AppConfig, {})

def calculate_system_fingerprint(config: Dict[str, Any]) -> str:
    """Calculates a 16-character hash of the configuration parameters."""
    import hashlib
    import json
    config_str = json.dumps(config, sort_keys=True)
    hash_object = hashlib.md5(config_str.encode())
    return hash_object.hexdigest()[:16]

if __name__ == '__main__':
    # Example usage:
    config = load_config()
    print(f"Loaded config: {config}")