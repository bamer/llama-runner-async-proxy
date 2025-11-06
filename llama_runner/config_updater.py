"""
Enhanced config auto-updater with versioning and migration.

This module provides intelligent configuration management with:
- Version migrations
- Automatic cleanup of missing models
- Structure optimization
- Comprehensive logging and debugging
"""
import json
import logging
import shutil
from pathlib import Path
from typing import Dict, Any, List, Callable, Optional, Set
from datetime import datetime

# Initialize logger for this module
logger = logging.getLogger(__name__)

# Current config version - increment when adding new migrations
CURRENT_CONFIG_VERSION: int = 2

# Set of deprecated parameters that should be removed from models
# Based on llama-server documentation analysis (updated 2025-11-06)
# Note: Using underscore naming convention to match actual config parameter names
DEPRECATED_PARAMS: Set[str] = {
    "defrag_thold",  # KV cache defragmentation threshold (DEPRECATED in llama-server)
    "dt",            # Short version of defrag-thold (not typically used with underscores)
    # Add more deprecated parameters here as they are identified in future versions
}

# Parameters that can be specified without a value (flags)
# These parameters don't require a value in the command line, just their presence is enough
# Based on llama-server documentation analysis (updated 2025-11-06)
FLAG_PARAMS: Set[str] = {
    # Core flags
    "flash-attn",          # Enable Flash Attention
    "jinja",               # Use jinja template for chat
    "no-perf",             # Disable internal libllama performance timings
    "mlock",               # Force system to keep model in RAM
    "no-mmap",             # Do not memory-map model
    "no-kv-offload",       # Disable KV offload
    "no-repack",           # Disable weight repacking
    "check-tensors",       # Check model tensor data for invalid values
    "no-op-offload",       # Disable offloading host tensor operations to device
    "kv-unified",          # Use single unified KV buffer for KV cache
    
    # Logging and debug flags
    "verbose-prompt",      # Print a verbose prompt before generation
    "escape",              # Process escape sequences
    "no-escape",           # Do not process escape sequences
    "log-disable",         # Disable logging
    "log-colors",          # Enable colored logging
    "verbose",             # Set verbosity to infinity
    "log-verbose",         # Set verbosity to infinity
    "offline",             # Offline mode (forces use of cache)
    "log-prefix",          # Enable prefix in log messages
    "log-timestamps",      # Enable timestamps in log messages
    
    # Generation flags
    "ignore-eos",          # Ignore end of stream token
    "special",             # Special tokens output enabled
    "no-warmup",           # Skip warming up the model
    "spm-infill",          # Use Suffix/Prefix/Middle pattern for infill
    
    # Server/API flags
    "no-webui",            # Disable the Web UI
    "embedding",           # Restrict to embedding use case
    "embeddings",          # Restrict to embedding use case (alias)
    "reranking",           # Enable reranking endpoint
    "rerank",              # Enable reranking endpoint (alias)
    "metrics",             # Enable prometheus compatible metrics endpoint
    "props",               # Enable changing global properties via POST /props
    "slots",               # Enable slots monitoring endpoint
    "no-slots",            # Disable slots monitoring endpoint
    
    # Multimodal flags
    "no-mmproj",           # Explicitly disable multimodal projector
    "no-mmproj-offload",   # Do not offload multimodal projector to GPU
    
    # MoE (Mixture of Experts) flags
    "cpu-moe",             # Keep all MoE weights in CPU
    "cpu-moe-draft",       # Keep all MoE weights in CPU for draft model
    
    # Cache and context flags
    "swa-full",            # Use full-size SWA cache
    "kv-unified",          # Use single unified KV buffer
    "no-context-shift",    # Disable context shift on infinite text generation
    "context-shift",       # Enable context shift on infinite text generation
    
    # Batching flags
    "cont-batching",       # Enable continuous batching
    "no-cont-batching",    # Disable continuous batching
    
    # LoRA flags
    "lora-init-without-apply",  # Load LoRA adapters without applying them
    
    # TTS flags
    "tts-use-guide-tokens",  # Use guide tokens to improve TTS word recall
    
    # Embeddings models presets (flags that download and use default models)
    "embd-bge-small-en-default",  # Use default bge-small-en-v1.5 model
    "embd-e5-small-en-default",   # Use default e5-small-v2 model
    "embd-gte-small-default",     # Use default gte-small model
    
    # FIM (Fill-In-the-Middle) models presets
    "fim-qwen-1.5b-default",  # Use default Qwen 2.5 Coder 1.5B
    "fim-qwen-3b-default",    # Use default Qwen 2.5 Coder 3B
    "fim-qwen-7b-default",    # Use default Qwen 2.5 Coder 7B
    "fim-qwen-7b-spec",       # Use Qwen 2.5 Coder 7B + 0.5B draft (speculative decoding)
    "fim-qwen-14b-spec",      # Use Qwen 2.5 Coder 14B + 0.5B draft (speculative decoding)
    "fim-qwen-30b-default",   # Use default Qwen 3 Coder 30B A3B Instruct
    
    # Assistant prefilling flag
    "no-prefill-assistant",  # Do not prefill assistant's response
}

class ConfigMigration:
    """
    Represents a config migration from one version to another.
    
    Attributes:
        from_version: Starting version number
        to_version: Target version number
        migrate_fn: Function that performs the migration
    """
    
    def __init__(
        self, 
        from_version: int, 
        to_version: int, 
        migrate_fn: Callable[[Dict[str, Any]], Dict[str, Any]]
    ) -> None:
        """
        Initialize a config migration.
        
        Args:
            from_version: Version to migrate from
            to_version: Version to migrate to
            migrate_fn: Migration function
        """
        self.from_version: int = from_version
        self.to_version: int = to_version
        self.migrate_fn: Callable[[Dict[str, Any]], Dict[str, Any]] = migrate_fn
        
        logger.debug(
            f"Registered migration: v{from_version} -> v{to_version}"
        )
    
    def apply(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply migration to config.
        
        Args:
            config: Configuration to migrate
            
        Returns:
            Migrated configuration
            
        Raises:
            Exception: If migration fails
        """
        logger.info(
            f"Applying migration: v{self.from_version} -> v{self.to_version}"
        )
        logger.debug(f"Config before migration: {len(config)} keys")
        
        try:
            result = self.migrate_fn(config)
            logger.debug(f"Config after migration: {len(result)} keys")
            logger.info(
                f"Migration v{self.from_version} -> v{self.to_version} completed successfully"
            )
            return result
        except Exception as e:
            logger.error(
                f"Migration v{self.from_version} -> v{self.to_version} failed: {e}",
                exc_info=True
            )
            raise

def migrate_v1_to_v2(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate from v1 (no version field) to v2.
    
    Changes in v2:
    - Add config_version field
    - Ensure model_discovery section exists
    - Ensure metrics section exists
    - Migrate old 'runtimes' to 'llama-runtimes' if needed
    
    Args:
        config: v1 configuration
        
    Returns:
        v2 configuration
    """
    logger.info("Starting migration v1 -> v2")
    logger.debug(f"Input config keys: {list(config.keys())}")
    
    # Add version field
    config["config_version"] = 2
    logger.debug("Added config_version = 2")
    
    # Ensure model_discovery section exists
    if "model_discovery" not in config:
        config["model_discovery"] = {
            "enabled": False,
            "base_path": "",
            "auto_update": True,
            "scan_depth": 2
        }
        logger.debug("Added default model_discovery section")
    else:
        logger.debug("model_discovery section already exists")
    
    # Ensure metrics section exists
    if "metrics" not in config:
        config["metrics"] = {
            "enabled": True,
            "log_summary_interval": 300  # seconds
        }
        logger.debug("Added default metrics section")
    else:
        logger.debug("metrics section already exists")
    
    # Migrate old 'runtimes' to 'llama-runtimes' if needed
    if "runtimes" in config and "llama-runtimes" not in config:
        config["llama-runtimes"] = config.pop("runtimes")
        logger.info("Migrated 'runtimes' to 'llama-runtimes'")
    elif "runtimes" in config:
        logger.warning("Both 'runtimes' and 'llama-runtimes' exist, keeping 'llama-runtimes'")
        config.pop("runtimes", None)
    
    logger.info("Migration v1 -> v2 completed")
    logger.debug(f"Output config keys: {list(config.keys())}")
    
    return config

# Registry of all migrations in chronological order
MIGRATIONS: List[ConfigMigration] = [
    ConfigMigration(1, 2, migrate_v1_to_v2),
    # Add future migrations here
    # ConfigMigration(2, 3, migrate_v2_to_v3),
]


def get_config_version(config: Dict[str, Any]) -> int:
    """
    Get config version, defaulting to 1 if not present.
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Version number (defaults to 1 for legacy configs)
    """
    version: int = config.get("config_version", 1)
    logger.debug(f"Config version: {version}")
    return version


def backup_config(config_path: Path) -> Path:
    """
    Create a timestamped backup of the config file.
    
    Args:
        config_path: Path to config file to backup
        
    Returns:
        Path to backup file
        
    Raises:
        IOError: If backup fails
    """
    timestamp: str = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path: Path = config_path.parent / f"config_backup_{timestamp}.json"
    
    logger.info(f"Creating config backup: {backup_path}")
    logger.debug(f"Source: {config_path}, Size: {config_path.stat().st_size} bytes")
    
    try:
        shutil.copy2(config_path, backup_path)
        logger.info(f"Config backed up successfully to {backup_path}")
        logger.debug(f"Backup size: {backup_path.stat().st_size} bytes")
        return backup_path
    except Exception as e:
        logger.error(f"Failed to create config backup: {e}", exc_info=True)
        raise

def apply_migrations(config: Dict[str, Any], config_path: Path) -> Dict[str, Any]:
    """
    Apply all necessary migrations to bring config to current version.
    
    This function:
    1. Checks current config version
    2. Creates a backup before migration
    3. Applies all necessary migrations in sequence
    4. Saves the migrated config
    
    Args:
        config: Current configuration
        config_path: Path to config file for backup and saving
        
    Returns:
        Migrated configuration
        
    Raises:
        Exception: If any migration fails
    """
    current_version: int = get_config_version(config)
    logger.info(f"Config current version: {current_version}, target version: {CURRENT_CONFIG_VERSION}")
    
    # Check if migration is needed
    if current_version == CURRENT_CONFIG_VERSION:
        logger.debug(f"Config is already at current version {CURRENT_CONFIG_VERSION}, no migration needed")
        return config
    
    if current_version > CURRENT_CONFIG_VERSION:
        logger.warning(
            f"Config version {current_version} is newer than supported version {CURRENT_CONFIG_VERSION}. "
            f"This may indicate a downgrade or version mismatch."
        )
        return config
    
    logger.info(f"Migration required: v{current_version} -> v{CURRENT_CONFIG_VERSION}")
    
    # Create backup before migration
    try:
        backup_path = backup_config(config_path)
        logger.info(f"Backup created before migration: {backup_path}")
    except Exception as e:
        logger.error(f"Failed to create backup, aborting migration: {e}")
        raise
    
    # Apply migrations in sequence
    migrated_config: Dict[str, Any] = config.copy()
    migrations_applied: int = 0
    
    for migration in MIGRATIONS:
        # Apply migration if it's in the path from current to target version
        if migration.from_version >= current_version and migration.to_version <= CURRENT_CONFIG_VERSION:
            try:
                logger.debug(f"Applying migration {migration.from_version} -> {migration.to_version}")
                migrated_config = migration.apply(migrated_config)
                migrations_applied += 1
            except Exception as e:
                logger.error(
                    f"Migration {migration.from_version}->{migration.to_version} failed: {e}",
                    exc_info=True
                )
                logger.error(f"Backup is available at: {backup_path}")
                raise
    
    logger.info(f"Applied {migrations_applied} migration(s) successfully")
    
    # Save migrated config
    try:
        logger.debug(f"Saving migrated config to {config_path}")
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(migrated_config, f, indent=2, ensure_ascii=False)
        logger.info(f"Config migrated from v{current_version} to v{CURRENT_CONFIG_VERSION} and saved")
    except Exception as e:
        logger.error(f"Failed to save migrated config: {e}", exc_info=True)
        logger.error(f"Backup is available at: {backup_path}")
        raise
    
    return migrated_config

def auto_cleanup_models(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove auto-discovered models whose files no longer exist.
    
    This function:
    - Checks all models marked as auto_discovered
    - Verifies the model file still exists
    - Removes models with missing files
    - Preserves manually configured models
    
    Args:
        config: Configuration to clean
        
    Returns:
        Cleaned configuration with only existing models
    """
    logger.debug("Starting auto-cleanup of missing models")
    
    models: Dict[str, Any] = config.get("models", {})
    if not models:
        logger.debug("No models in config, skipping cleanup")
        return config
    
    logger.debug(f"Checking {len(models)} model(s) for cleanup")
    
    removed_count: int = 0
    kept_count: int = 0
    cleaned_models: Dict[str, Any] = {}
    
    for model_name, model_info in models.items():
        # Check if it's auto-discovered
        is_auto_discovered: bool = model_info.get("auto_discovered", False)
        model_path: str = model_info.get("model_path", "")
        
        logger.debug(
            f"Checking model '{model_name}': "
            f"auto_discovered={is_auto_discovered}, "
            f"path='{model_path}'"
        )
        
        if is_auto_discovered:
            # Verify file exists
            if not model_path:
                logger.warning(f"Auto-discovered model '{model_name}' has no path, removing")
                removed_count += 1
                continue
            
            model_file = Path(model_path)
            if not model_file.exists():
                logger.info(
                    f"Removing missing auto-discovered model: '{model_name}' "
                    f"(file not found: {model_path})"
                )
                removed_count += 1
                continue
            else:
                logger.debug(f"Model file exists: {model_path}")
        
        # Keep model
        cleaned_models[model_name] = model_info
        kept_count += 1
    
    if removed_count > 0:
        logger.info(
            f"Cleaned up {removed_count} missing model(s), "
            f"kept {kept_count} model(s)"
        )
        config["models"] = cleaned_models
    else:
        logger.debug(f"No missing models found, kept all {kept_count} model(s)")
    
    return config

def remove_deprecated_params(model_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove deprecated parameters from model configuration.
    
    Args:
        model_info: Model configuration dictionary
        
    Returns:
        Model configuration with deprecated params removed
    """
    if not DEPRECATED_PARAMS:
        return model_info
    
    params = model_info.get("params", {})
    removed_params: List[str] = []
    
    for deprecated_param in DEPRECATED_PARAMS:
        if deprecated_param in params:
            params.pop(deprecated_param)
            removed_params.append(deprecated_param)
    
    if removed_params:
        logger.info(f"Removed deprecated parameters: {', '.join(removed_params)}")
        model_info["params"] = params
    
    return model_info


def clean_empty_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Remove parameters with empty values, except for flag parameters.
    
    Flag parameters (like --jinja, --flash-attn) don't need values
    and should be kept even if empty.
    
    Args:
        params: Parameters dictionary
        
    Returns:
        Cleaned parameters dictionary
    """
    cleaned: Dict[str, Any] = {}
    removed_count: int = 0
    
    for key, value in params.items():
        # Keep flag parameters even if empty
        if key in FLAG_PARAMS:
            cleaned[key] = value
            logger.debug(f"Kept flag parameter: {key}")
            continue
        
        # Remove empty values for non-flag parameters
        if value is None or value == "" or (isinstance(value, dict) and not value):
            logger.debug(f"Removing empty parameter: {key}")
            removed_count += 1
            continue
        
        cleaned[key] = value
    
    if removed_count > 0:
        logger.debug(f"Removed {removed_count} empty parameter(s)")
    
    return cleaned


def optimize_config_structure(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Optimize config structure for performance and maintainability.
    
    This function:
    - Removes completely empty sections (no keys at all)
    - Keeps sections with parameters even if some are empty
    - Ensures models have required fields
    - Removes deprecated parameters
    - Cleans empty parameter values
    
    Args:
        config: Configuration to optimize
        
    Returns:
        Optimized configuration
    """
    logger.debug("Starting config structure optimization")
    logger.debug(f"Config has {len(config)} top-level key(s)")
    
    # Remove completely empty sections (sections with no keys)
    # But keep sections that have keys, even if values are empty
    removed_sections: List[str] = []
    for key in list(config.keys()):
        value = config[key]
        
        # Only remove if it's a dict with NO keys at all
        if isinstance(value, dict) and len(value) == 0:
            logger.debug(f"Removing completely empty section: {key}")
            del config[key]
            removed_sections.append(key)
        # Note: We do NOT remove sections that have keys, even if values are empty/null
        # This is by design to keep the structure predictable
    
    if removed_sections:
        logger.info(f"Removed {len(removed_sections)} completely empty section(s): {', '.join(removed_sections)}")
    
    # Optimize models section
    models: Dict[str, Any] = config.get("models", {})
    if models:
        logger.debug(f"Optimizing {len(models)} model(s)")
        optimized_models_count: int = 0
        
        for model_name, model_info in models.items():
            logger.debug(f"Optimizing model: {model_name}")
            original_keys = set(model_info.keys())
            
            # Ensure display_name
            if "display_name" not in model_info:
                model_info["display_name"] = model_name
                logger.debug(f"Added display_name for model '{model_name}'")
            
            # Ensure llama_cpp_runtime
            if "llama_cpp_runtime" not in model_info:
                default_runtime: str = config.get("default_runtime", "default")
                model_info["llama_cpp_runtime"] = default_runtime
                logger.debug(f"Added llama_cpp_runtime='{default_runtime}' for model '{model_name}'")
            
            # Remove deprecated parameters
            model_info = remove_deprecated_params(model_info)
            
            # Clean empty parameters (but keep flag parameters)
            if "params" in model_info and isinstance(model_info["params"], dict):
                original_param_count = len(model_info["params"])
                model_info["params"] = clean_empty_params(model_info["params"])
                new_param_count = len(model_info["params"])
                
                if original_param_count != new_param_count:
                    logger.debug(
                        f"Model '{model_name}': cleaned params "
                        f"({original_param_count} -> {new_param_count})"
                    )
            
            # Update model in config
            models[model_name] = model_info
            
            # Check if anything changed
            new_keys = set(model_info.keys())
            if original_keys != new_keys:
                optimized_models_count += 1
        
        if optimized_models_count > 0:
            logger.info(f"Optimized {optimized_models_count} model(s)")
        else:
            logger.debug("No model optimizations needed")
        
        config["models"] = models
    else:
        logger.debug("No models to optimize")
    
    logger.debug("Config structure optimization completed")
    return config

def update_config_smart(config_path: Path, force_backup: bool = False) -> Dict[str, Any]:
    """
    Smart config updater that handles migrations, cleanup, and optimization.
    
    This is the main entry point for config updates. It:
    1. Loads the current configuration
    2. Applies version migrations if needed
    3. Cleans up missing auto-discovered models
    4. Optimizes the config structure
    5. Saves changes if any were made
    
    Args:
        config_path: Path to config file
        force_backup: Force backup even if no changes needed (default: False)
        
    Returns:
        Updated configuration dictionary
        
    Raises:
        FileNotFoundError: If config file doesn't exist
        JSONDecodeError: If config file is invalid JSON
        Exception: If update process fails
    """
    logger.info("=" * 60)
    logger.info("Starting smart config update")
    logger.info(f"Config file: {config_path}")
    logger.info("=" * 60)
    
    # Verify config file exists
    if not config_path.exists():
        error_msg = f"Config file not found: {config_path}"
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)
    
    # Load current config
    logger.debug(f"Loading config from {config_path}")
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config: Dict[str, Any] = json.load(f)
        logger.info(f"Config loaded successfully ({len(config)} top-level keys)")
        logger.debug(f"Config keys: {list(config.keys())}")
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in config file: {e}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Failed to load config: {e}", exc_info=True)
        raise
    
    # Create backup if forced
    if force_backup:
        try:
            backup_path = backup_config(config_path)
            logger.info(f"Forced backup created: {backup_path}")
        except Exception as e:
            logger.warning(f"Failed to create forced backup: {e}")
    
    # Track if any changes were made
    config_changed: bool = False
    original_version: int = get_config_version(config)
    
    # Step 1: Apply migrations if needed
    logger.info("Step 1/3: Checking for version migrations")
    try:
        migrated_config = apply_migrations(config, config_path)
        if get_config_version(migrated_config) != original_version:
            config = migrated_config
            config_changed = True
            logger.info("Config was migrated to new version")
        else:
            logger.debug("No migration needed")
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        raise
    
    # Step 2: Auto-cleanup missing models
    logger.info("Step 2/3: Cleaning up missing models")
    try:
        models_before = len(config.get("models", {}))
        config = auto_cleanup_models(config)
        models_after = len(config.get("models", {}))
        
        if models_before != models_after:
            config_changed = True
            logger.info(f"Model cleanup: {models_before} -> {models_after} models")
        else:
            logger.debug("No model cleanup needed")
    except Exception as e:
        logger.error(f"Model cleanup failed: {e}", exc_info=True)
        # Don't raise - continue with optimization
    
    # Step 3: Optimize structure
    logger.info("Step 3/3: Optimizing config structure")
    try:
        # Take a snapshot for comparison
        config_snapshot = json.dumps(config, sort_keys=True)
        
        config = optimize_config_structure(config)
        
        # Check if anything changed
        config_after = json.dumps(config, sort_keys=True)
        if config_snapshot != config_after:
            config_changed = True
            logger.info("Config structure was optimized")
        else:
            logger.debug("No optimization needed")
    except Exception as e:
        logger.error(f"Config optimization failed: {e}", exc_info=True)
        # Don't raise - config is still valid
    
    # Save if changes were made
    if config_changed:
        logger.info("Saving updated config")
        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            logger.info("Config saved successfully")
        except Exception as e:
            logger.error(f"Failed to save updated config: {e}", exc_info=True)
            raise
    else:
        logger.info("No changes needed, config is up to date")
    
    logger.info("=" * 60)
    logger.info("Smart config update completed successfully")
    logger.info("=" * 60)
    
    return config
