"""
Runner Service - Manages the lifecycle of model runners (Llama.cpp, Whisper, etc.)
Replaces the previous LlamaRunnerManager logic with a more modular service approach.
"""

from typing import Dict, Any, Optional, Callable, List, Awaitable
import logging
import asyncio

from llama_runner.repositories.config_repository import ConfigRepository
from llama_runner.models.config_model import AppConfig, ModelConfig, RuntimeConfig, AudioConfig
from llama_runner.llama_cpp_runner import LlamaCppRunner
from llama_runner.faster_whisper_runner import FasterWhisperRunner
from llama_runner.services.metrics_collector import MetricsCollector  # Correction de l'import

logger = logging.getLogger(__name__)

class RunnerService:
    """
    Core service for managing Llama and Whisper runners based on configuration.
    
    This service replaces the logic previously in LlamaRunnerManager.
    It depends on ConfigRepository for configuration access.
    
    Attributes:
        config_repo: Instance of ConfigRepository for config access.
        config: Cached AppConfig for easy access.
        llama_runners: Dictionary of active LlamaCppRunner instances.
        whisper_runners: Dictionary of active FasterWhisperRunner instances.
        concurrent_runners_limit: Semaphore to limit concurrent runners.
        metrics: MetricsCollector for tracking runner metrics.
        on_started: Callback for runner start events.
        on_stopped: Callback for runner stop events.
        on_error: Callback for runner errors.
        on_port_ready: Callback for runner port readiness.
    """
    
    def __init__(
        self,
        config_repo: ConfigRepository,
        on_started: Optional[Callable[[str], None]] = None,
        on_stopped: Optional[Callable[[str], None]] = None,
        on_error: Optional[Callable[[str, str, List[str]], None]] = None,
        on_port_ready: Optional[Callable[[str, int], None]] = None,
    ):
        self.config_repo = config_repo
        self.config: AppConfig = config_repo.get_config() # Cache config for easy access

        self.llama_runners: Dict[str, LlamaCppRunner] = {}
        self.whisper_runners: Dict[str, FasterWhisperRunner] = {}
        
        # Track first runner for port 8585 routing
        self.first_runner_started = False
        
        # Semaphore for concurrent runners limit
        concurrent_limit = self.config.get("concurrentRunners", 1)
        self.concurrent_runners_limit = asyncio.Semaphore(concurrent_limit)
        
        # Initialize metrics collector
        self.metrics = MetricsCollector()
        
        # Wrap callbacks to include metrics
        self.on_started = self._wrap_on_started(on_started)
        self.on_stopped = self._wrap_on_stopped(on_stopped)
        self.on_error = self._wrap_on_error(on_error)
        self.on_port_ready = self._wrap_on_port_ready(on_port_ready)
    
    def _wrap_on_started(self, callback: Optional[Callable[[str], None]]) -> Callable[[str], None]:
        """Wrap started callback to include metrics."""
        def wrapper(model_name: str):
            self.metrics.record_start(model_name)
            if callback:
                callback(model_name)
        return wrapper
    
    def _wrap_on_stopped(self, callback: Optional[Callable[[str], None]]) -> Callable[[str], None]:
        """Wrap stopped callback to include metrics."""
        def wrapper(model_name: str):
            self.metrics.record_stop(model_name)
            if callback:
                callback(model_name)
        return wrapper
    
    def _wrap_on_error(self, callback: Optional[Callable[[str, str, List[str]], None]]) -> Callable[[str, str, List[str]], None]:
        """Wrap error callback to include metrics."""
        def wrapper(model_name: str, error_msg: str, output: List[str]):
            self.metrics.record_error(model_name, error_msg)
            if callback:
                callback(model_name, error_msg, output)
        return wrapper
    
    def _wrap_on_port_ready(self, callback: Optional[Callable[[str, int], None]]) -> Callable[[str, int], None]:
        """Wrap port ready callback to include metrics."""
        def wrapper(model_name: str, port: int):
            self.metrics.record_ready(model_name, port)
            if callback:
                callback(model_name, port)
        return wrapper

    def _get_model_config(self, model_name: str) -> ModelConfig:
        """Helper to get model config, raising KeyError if not found."""
        return self.config_repo.get_model_config(model_name)

    def _get_runtime_config(self, runtime_name: str) -> RuntimeConfig:
        """Helper to get runtime config, raising KeyError if not found."""
        return self.config_repo.get_runtime_config(runtime_name)

    async def request_runner_start(self, model_name: str, is_whisper: bool = False) -> int:
        """
        Request to start a runner for a given model.
        Returns the port number when the runner is ready.
        """
        if is_whisper:
            return await self._request_whisper_runner_start(model_name)
        else:
            return await self._request_llama_runner_start(model_name)

    async def _request_llama_runner_start(self, model_name: str) -> int:
        """Internal method to start a Llama runner."""
        if model_name in self.llama_runners:
            runner = self.llama_runners[model_name]
            if runner.is_running():
                logger.debug(f"Llama runner for {model_name} is already running on port {runner.get_port()}")
                return runner.get_port() # type: ignore[return-value] # Port should be set if running
            else:
                logger.warning(f"Llama runner for {model_name} exists but is not running. Removing reference.")
                del self.llama_runners[model_name]

        # Acquire semaphore to respect concurrent limit
        async with self.concurrent_runners_limit:
            logger.info(f"Starting Llama runner for {model_name}")
            
            model_config = self._get_model_config(model_name)
            runtime_name = model_config["llama_cpp_runtime"]
            runtime_config = self._get_runtime_config(runtime_name)
            
            llama_cpp_runtime_cmd = runtime_config["runtime"]
            model_path = model_config["model_path"]
            parameters = model_config.get("parameters", {})
            
            # Only first runner gets port 8585, others get random ports (port=0)
            port_override = 8585 if not self.first_runner_started else 0
            if not self.first_runner_started:
                self.first_runner_started = True
                logger.info("First runner will use port 8585 for web UI routing")
            else:
                logger.info(f"Runner {model_name} will use random port (0) to avoid conflicts")
            
            runner = LlamaCppRunner(
                model_name=model_name,
                model_path=model_path,
                llama_cpp_runtime=llama_cpp_runtime_cmd,
                on_started=self.on_started,
                on_stopped=self.on_stopped,
                on_error=self.on_error,
                on_port_ready=self.on_port_ready,
                port=port_override,  # Pass port override to runner
                **parameters
            )
            
            self.llama_runners[model_name] = runner
            
            # Start the runner process
            asyncio.create_task(runner.run())
            
            # Wait for the runner to be ready (port to be assigned)
            # We can use a Future or poll the runner's port status
            while runner.get_port() is None:
                await asyncio.sleep(0.1) # Poll every 100ms
            
            port = runner.get_port()
            logger.info(f"Llama runner for {model_name} is ready on port {port}")
            return port # type: ignore[return-value] # Assuming port is always an int when set

    async def _request_whisper_runner_start(self, model_name: str) -> int:
        """
        Internal method to initialize/start a Whisper runner.
        """
        # For FasterWhisperRunner, initialization is synchronous (loading the model)
        # We don't start a separate process like with LlamaCppRunner.
        # Instead, we just instantiate it and keep it in the dictionary.
        # The port concept doesn't apply here as it's not a server.
        # We return a sentinel value or handle this differently.
        # For now, let's just create it and return a special code or handle it in the caller.
        # The AudioService will manage the interaction with this runner instance.
        
        if model_name in self.whisper_runners:
            logger.debug(f"FasterWhisper runner for {model_name} is already initialized.")
            # We could return a special port code like -1 or handle readiness differently
            # For compatibility with the proxy, we might need a different approach.
            # Let's assume for now that initialization is enough and return a dummy port.
            # A better approach might be to change the proxy logic to not expect a port for whisper.
            # For now, we'll just initialize it if not present and return 0 or a specific indicator.
            # The proxy should check if the model is a whisper model before requesting a port.
            return 0 # Placeholder - Whisper runner doesn't use a port in the same way

        logger.info(f"Initializing FasterWhisper runner for {model_name}")
        
        # Get audio config section, handling potential None value
        audio_section: Optional[AudioConfig] = self.config.get("audio")
        if audio_section is None:
            # Handle case where audio section is missing or explicitly set to None
            logger.warning("Audio section is missing or None in config. Using empty models dict.")
            models_config: Dict[str, Any] = {}
        else:
            models_config = audio_section.get("models", {})
        
        if model_name not in models_config:
            raise KeyError(f"Audio model '{model_name}' not found in audio configuration")
        
        # Create a compatible config object for FasterWhisperRunner
        # It expects the whole audio section and the model name
        # Note: Passing the full audio_section might be more appropriate if FasterWhisperRunner needs other parts
        # For now, constructing as before but with clearer typing.
        audio_config_for_runner = {
            'models': models_config,
            # Add other audio config parts if needed by FasterWhisperRunner
        }
        
        runner = FasterWhisperRunner(
            audio_config=audio_config_for_runner,
            model_name=model_name
        )
        
        self.whisper_runners[model_name] = runner
        logger.info(f"FasterWhisper runner for {model_name} initialized.")
        
        # Return a special indicator that this is not a standard port-based runner
        return 0 

    def get_runner_port(self, model_name: str) -> Optional[int]:
        """
        Get the port for a running Llama runner.
        Returns None if the runner is not running or is a whisper runner.
        """
        if model_name in self.llama_runners:
            runner = self.llama_runners[model_name]
            if runner.is_running():
                return runner.get_port()
        return None

    def is_llama_runner_running(self, model_name: str) -> bool:
        """
        Check if a Llama runner is currently running.
        """
        if model_name in self.llama_runners:
            return self.llama_runners[model_name].is_running()
        return False

    def is_whisper_runner_running(self, model_name: str) -> bool:
        """
        Check if a Whisper runner is initialized.
        """
        # For FasterWhisperRunner, we consider it "running" if it's initialized
        return model_name in self.whisper_runners

    def get_faster_whisper_runner(self, model_name: str) -> Optional[FasterWhisperRunner]:
        """
        Get the FasterWhisperRunner instance for a model.
        """
        return self.whisper_runners.get(model_name)

    async def stop_llama_runner(self, model_name: str) -> None:
        """
        Stop a specific Llama runner by model name.
        """
        runner = self.llama_runners.get(model_name)
        if runner and runner.is_running():
            try:
                await runner.stop()
            except Exception as e:
                logger.error(f"Error stopping Llama runner {model_name}: {e}")
                # Optionally re-raise or handle
        # Remove the runner from the dictionary after stopping
        # This ensures a fresh instance is created if started again
        if model_name in self.llama_runners:
            del self.llama_runners[model_name]

    async def stop_all_llama_runners_async(self) -> None:
        """
        Stop all currently running Llama runners.
        """
        # List of coroutines (Awaitables) that resolve to None when the runner stops
        stop_coroutines: List[Awaitable[None]] = []
        for runner in self.llama_runners.values():
            if runner.is_running():
                # runner.stop() is an async def, so calling it returns a coroutine
                # asyncio.gather can directly await these coroutines
                stop_coroutines.append(runner.stop())
        if stop_coroutines:
            # Use return_exceptions=True to prevent one failure from stopping others
            await asyncio.gather(*stop_coroutines, return_exceptions=True)
        self.llama_runners.clear()

    def set_concurrent_runners_limit(self, limit: int):
        """
        Dynamically adjust the concurrent runners limit.
        """
        if limit < 1:
            logger.warning("Concurrent runners limit must be at least 1, setting to 1.")
            limit = 1
        self.concurrent_runners_limit = asyncio.Semaphore(limit)