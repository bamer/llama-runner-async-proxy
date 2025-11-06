from typing import Dict, Any, Optional, TypedDict

class ModelConfig(TypedDict):
    """
    Typed dictionary for model configuration.
    
    Attributes:
        model_path: Path to the GGUF model file.
        llama_cpp_runtime: Name of the runtime to use (key in runtimes config).
        parameters: Dictionary of runtime parameters.
        display_name: Human-readable name for the model.
        auto_discovered: Whether the model was auto-discovered.
        auto_update_model: Whether to auto-update the model path.
        has_tools: Optional flag indicating if the model supports tools (from runtime config).
    """
    model_path: str
    llama_cpp_runtime: str
    parameters: Dict[str, Any]
    display_name: str
    auto_discovered: bool
    auto_update_model: bool
    has_tools: Optional[bool]

class RuntimeConfig(TypedDict):
    """
    Typed dictionary for runtime configuration.
    
    Attributes:
        runtime: Path or command to the runtime executable.
        supports_tools: Whether this runtime supports tools.
    """
    runtime: str
    supports_tools: bool

class AudioConfig(TypedDict):
    """
    Typed dictionary for audio configuration.
    
    Attributes:
        runtimes: Dictionary of audio runtimes.
        models: Dictionary of audio models.
    """
    runtimes: Dict[str, RuntimeConfig]
    models: Dict[str, ModelConfig] # Using ModelConfig as the structure is similar

class ProxyConfig(TypedDict):
    """
    Typed dictionary for proxy configuration.
    
    Attributes:
        enabled: Whether the proxy is enabled.
        api_key: Optional API key for the proxy.
    """
    enabled: bool
    api_key: Optional[str]

class LoggingConfig(TypedDict):
    """
    Typed dictionary for logging configuration.
    
    Attributes:
        prompt_logging_enabled: Whether prompt logging is enabled.
    """
    prompt_logging_enabled: bool

class AppConfig(TypedDict, total=False):
    """
    Typed dictionary for the main application configuration.
    
    Attributes:
        models: Dictionary of model configurations.
        runtimes: Dictionary of runtime configurations.
        default_runtime: Default runtime to use if not specified for a model.
        concurrentRunners: Maximum number of runners that can run concurrently.
        proxies: Configuration for Ollama and LMStudio proxies.
        logging: Configuration for logging.
        audio: Configuration for audio processing.
        model_discovery: Configuration for automatic model discovery.
        global_model_parameters: Global parameters applied to all models.
    """
    models: Dict[str, ModelConfig]
    runtimes: Dict[str, RuntimeConfig]
    default_runtime: str
    concurrentRunners: int
    proxies: Dict[str, ProxyConfig]
    logging: LoggingConfig
    audio: Optional[AudioConfig]
    model_discovery: Optional[Dict[str, Any]]
    global_model_parameters: Optional[Dict[str, Any]]