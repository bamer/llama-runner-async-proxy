"""Configuration validation module."""
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ValidationError:
    """Represents a validation error."""
    def __init__(self, severity: str, category: str, message: str):
        self.severity = severity  # "error", "warning"
        self.category = category  # "model", "runtime", "audio", "config"
        self.message = message
    
    def __str__(self) -> str:
        return f"[{self.severity.upper()}] {self.category}: {self.message}"

def validate_config(config: Dict[str, Any]) -> List[ValidationError]:
    """
    Validate configuration and return list of errors/warnings.
    
    Args:
        config: Application configuration dictionary
        
    Returns:
        List of ValidationError objects
    """
    errors: List[ValidationError] = []
    
    # Validate models
    models = config.get("models", {})
    if not models:
        errors.append(ValidationError("warning", "config", "No models configured"))
    
    for model_name, model_config in models.items():
        # Check model path exists
        model_path = model_config.get("model_path")
        if not model_path:
            errors.append(ValidationError("error", "model", f"{model_name}: model_path is required"))
        elif not Path(model_path).exists():
            errors.append(ValidationError("error", "model", f"{model_name}: model file not found at {model_path}"))
        
        # Check runtime exists
        runtime_name = model_config.get("llama_cpp_runtime")
        if runtime_name and runtime_name not in config.get("llama-runtimes", {}):
            errors.append(ValidationError("error", "model", f"{model_name}: runtime '{runtime_name}' not found in llama-runtimes"))
    
    # Validate runtimes
    runtimes = config.get("llama-runtimes", {})
    for runtime_name, runtime_config in runtimes.items():
        runtime_path = runtime_config.get("runtime")
        if runtime_path and runtime_path != "llama-server":
            # Check if custom runtime exists
            if not Path(runtime_path).exists():
                errors.append(ValidationError("warning", "runtime", f"{runtime_name}: runtime executable not found at {runtime_path}"))
    
    # Validate audio configs
    audio_config = config.get("audio", {})
    if audio_config:
        audio_models = audio_config.get("models", {})
        for audio_model_name, audio_model_config in audio_models.items():
            model_path = audio_model_config.get("model_path")
            if model_path and model_path not in ["tiny", "base", "small", "medium", "large"]:
                # It's a custom path
                if not Path(model_path).exists():
                    errors.append(ValidationError("warning", "audio", f"{audio_model_name}: model not found at {model_path}"))
    
    # Validate concurrent runners limit
    concurrent_limit = config.get("concurrentRunners", 1)
    if concurrent_limit < 1:
        errors.append(ValidationError("error", "config", "concurrentRunners must be >= 1"))
    elif concurrent_limit > 10:
        errors.append(ValidationError("warning", "config", f"concurrentRunners={concurrent_limit} is very high, may cause resource issues"))
    
    return errors

def log_validation_results(errors: List[ValidationError]) -> bool:
    """
    Log validation results and return True if no errors (warnings are OK).
    
    Args:
        errors: List of ValidationError objects
        
    Returns:
        True if no errors, False otherwise
    """
    if not errors:
        logger.info("Configuration validation: OK")
        return True
    
    has_errors = False
    for error in errors:
        if error.severity == "error":
            has_errors = True
            logger.error(str(error))
        else:
            logger.warning(str(error))
    
    if has_errors:
        logger.error(f"Configuration validation FAILED with {sum(1 for e in errors if e.severity == 'error')} error(s)")
    else:
        logger.warning(f"Configuration validation passed with {len(errors)} warning(s)")
    
    return not has_errors
