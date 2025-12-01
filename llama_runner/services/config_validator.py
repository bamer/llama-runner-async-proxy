"""Configuration validation module with circuit breaker pattern for external service calls."""
from pathlib import Path
from typing import List, Dict, Any
import logging
import asyncio
from llama_runner.patterns.circuit_breaker import circuit_breaker

logger = logging.getLogger(__name__)

class ValidationError:
    """Represents a validation error."""
    def __init__(self, severity: str, category: str, message: str):
        self.severity = severity  # "error", "warning"
        self.category = category  # "model", "runtime", "audio", "config"
        self.message = message
    
    def __str__(self) -> str:
        return f"[{self.severity.upper()}] {self.category}: {self.message}"

@circuit_breaker(failure_threshold=3, recovery_timeout=30)
async def validate_model_path_async(model_path: str) -> bool:
    """Async validation of model path with circuit breaker protection"""
    try:
        # Simulate async validation (e.g., checking path, permissions, etc.)
        await asyncio.sleep(0.01)  # Small delay to simulate async work
        return Path(model_path).exists()
    except Exception as e:
        logger.debug(f"Async path validation failed: {e}")
        raise

@circuit_breaker(failure_threshold=2, recovery_timeout=60)
async def validate_runtime_service_async(runtime_name: str) -> Dict[str, Any]:
    """Async validation of runtime service with circuit breaker protection"""
    try:
        # Simulate async service validation (e.g., health check, version check, etc.)
        await asyncio.sleep(0.05)  # Small delay to simulate async service call
        return {"status": "healthy", "runtime": runtime_name}
    except Exception as e:
        logger.debug(f"Runtime service validation failed: {e}")
        raise

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

async def validate_config_async(config: Dict[str, Any]) -> List[ValidationError]:
    """
    Async version of config validation with circuit breaker protection for external calls.
    
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
    
    # Store async validation tasks
    validation_tasks = []
    
    for model_name, model_config in models.items():
        # Check model path exists
        model_path = model_config.get("model_path")
        if not model_path:
            errors.append(ValidationError("error", "model", f"{model_name}: model_path is required"))
        else:
            # Use async validation with circuit breaker for path checking
            task = asyncio.create_task(
                _validate_model_path_with_circuit(model_name, model_path, errors)
            )
            validation_tasks.append(task)
        
        # Check runtime exists
        runtime_name = model_config.get("llama_cpp_runtime")
        if runtime_name and runtime_name not in config.get("llama-runtimes", {}):
            errors.append(ValidationError("error", "model", f"{model_name}: runtime '{runtime_name}' not found in llama-runtimes"))
        elif runtime_name:
            # Use async validation with circuit breaker for runtime service checking
            task = asyncio.create_task(
                _validate_runtime_service_with_circuit(model_name, runtime_name, errors)
            )
            validation_tasks.append(task)
    
    # Wait for all async validations to complete
    if validation_tasks:
        await asyncio.gather(*validation_tasks, return_exceptions=True)
    
    # Validate runtimes (synchronous for now, but could be made async)
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

async def _validate_model_path_with_circuit(model_name: str, model_path: str, errors: List[ValidationError]):
    """Helper function for async model path validation with circuit breaker"""
    try:
        exists = await validate_model_path_async(model_path)
        if not exists:
            errors.append(ValidationError("error", "model", f"{model_name}: model file not found at {model_path}"))
    except Exception as e:
        logger.warning(f"Circuit breaker blocked model path validation for {model_name}: {e}")
        errors.append(ValidationError("warning", "model", f"{model_name}: could not validate model path (circuit breaker open)"))

async def _validate_runtime_service_with_circuit(model_name: str, runtime_name: str, errors: List[ValidationError]):
    """Helper function for async runtime service validation with circuit breaker"""
    try:
        result = await validate_runtime_service_async(runtime_name)
        logger.debug(f"Runtime service validation successful for {runtime_name}: {result}")
    except Exception as e:
        logger.warning(f"Circuit breaker blocked runtime service validation for {runtime_name}: {e}")
        errors.append(ValidationError("warning", "model", f"{model_name}: could not validate runtime service (circuit breaker open)"))

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
