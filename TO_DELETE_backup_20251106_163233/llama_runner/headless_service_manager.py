import logging
import asyncio
from typing import Dict, Any, List, Optional, Awaitable # Added Awaitable import
import uvicorn

from llama_runner.services.runner_service import RunnerService as LlamaRunnerManager
from llama_runner.ollama_proxy_thread import OllamaProxyServer, app as ollama_app
from llama_runner.lmstudio_proxy_thread import LMStudioProxyServer, app as lmstudio_app
from llama_runner.models.config_model import AppConfig, ModelConfig, AudioConfig # Import typed config models

logger = logging.getLogger(__name__)

class HeadlessServiceManager:
    def __init__(self, app_config: AppConfig, model_config: Dict[str, ModelConfig]):
        self.app_config: AppConfig = app_config # Type hint for app_config
        self.models_specific_config: Dict[str, ModelConfig] = model_config # Type hint for models_specific_config
        self.llama_runner_manager: LlamaRunnerManager | None = None
        self.ollama_proxy: OllamaProxyServer | None = None
        self.lmstudio_proxy: LMStudioProxyServer | None = None
        # Instance variables for servers and tasks, typed here
        self.ollama_server: Optional[uvicorn.Server] = None
        self.lmstudio_server: Optional[uvicorn.Server] = None
        self.running_tasks: List[asyncio.Task[None]] = [] # Type hint for running_tasks
        self._initialize_services()

    def _on_runner_error(self, model_name: str, message: str, output_buffer: List[str]):
        logger.error(f"Runner error for {model_name}: {message}")

    def _on_runner_event(self, message: str):
        logger.info(f"Runner Manager Event: {message}")

    def _on_port_ready(self, name: str, port: int):
        logger.info(f"Port {port} ready for {name}")

    def _initialize_services(self):
        logger.info("Initializing services for headless mode...")
        # Get audio configuration section, providing a default empty dict if missing
        # The AppConfig TypedDict allows optional keys, so .get() is safe.
        # The return type is Optional[AudioConfig], so we need to handle the None case.
        audio_config_raw: Optional[AudioConfig] = self.app_config.get("audio") # Type hint for raw audio config
        if audio_config_raw is None:
            # Handle case where audio section is missing or explicitly set to None
            logger.warning("Audio section is missing or None in config. Using empty models dict.")
            audio_config: AudioConfig = {"runtimes": {}, "models": {}} # Provide a default empty AudioConfig
        else:
            audio_config = audio_config_raw # Use the retrieved config
        # Initialize ConfigRepository first
        from llama_runner.repositories.config_repository import ConfigRepository
        # We need to pass the full config, not just parts of it.
        # The RunnerService will use ConfigRepository internally.
        # For now, we'll pass a dummy config and let RunnerService load its own.
        # A better way might be to pass the config we already loaded.
        # Let's assume HeadlessServiceManager gets the full config at init.
        # We'll create a temporary ConfigRepository here to pass to RunnerService.
        # A more elegant solution would be to pass the already loaded config from main.py.
        # For now, RunnerService will load it again.
        temp_config_repo = ConfigRepository() 
        self.llama_runner_manager = LlamaRunnerManager(
            config_repo=temp_config_repo,
            on_started=lambda name: self._on_runner_event(f"Started {name}"),
            on_stopped=lambda name: self._on_runner_event(f"Stopped {name}"),
            on_error=self._on_runner_error,
            on_port_ready=self._on_port_ready,
        )

        logger.info("LlamaRunnerManager initialized.")

        # Get proxies configuration section, providing a default empty dict if missing
        proxies_config: Dict[str, Any] = self.app_config.get("proxies", {}) # Type hint for proxies_config
        # Check Ollama proxy settings
        ollama_proxy_settings: Dict[str, Any] = proxies_config.get("ollama", {}) # Type hint for nested dict
        if ollama_proxy_settings.get("enabled", True): # Default to True if not specified
            logger.info("Ollama Proxy is enabled. Creating server...")
            self.ollama_proxy = OllamaProxyServer(
                all_models_config=self.models_specific_config,
                get_runner_port_callback=self.llama_runner_manager.get_runner_port,
                request_runner_start_callback=self.llama_runner_manager.request_runner_start,
                llama_runner_manager=self.llama_runner_manager
            )

        # Check LM Studio proxy settings
        lmstudio_proxy_settings: Dict[str, Any] = proxies_config.get("lmstudio", {}) # Type hint for nested dict
        if lmstudio_proxy_settings.get("enabled", True): # Default to True if not specified
            logger.info("LM Studio Proxy is enabled. Creating server...")
            # Get runtimes configuration, providing a default empty dict if missing
            runtimes_config: Dict[str, Any] = self.app_config.get("llama-runtimes", {}) # Type hint for runtimes_config
            self.lmstudio_proxy = LMStudioProxyServer(
                all_models_config=self.models_specific_config,
                runtimes_config=runtimes_config, # Use typed local variable
                get_runner_port_callback=self.llama_runner_manager.get_runner_port,
                request_runner_start_callback=self.llama_runner_manager.request_runner_start,
                is_model_running_callback=self.llama_runner_manager.is_llama_runner_running,
                on_runner_port_ready=self._on_port_ready,
                on_runner_stopped=lambda name: self._on_runner_event(f"Stopped {name}"),
                llama_runner_manager=self.llama_runner_manager
            )



    async def start_services(self):
        """Start all initialized services."""
        logger.info("Starting all services...")
        # Re-initialize the list of running tasks for this session
        self.running_tasks: List[asyncio.Task[None]] = [] # Re-initialize with explicit type hint

        if self.ollama_proxy and self.llama_runner_manager:
            logger.info("Starting Ollama proxy server...")
            # Configure the Ollama app before starting
            try:
                ollama_app.state.get_runner_port_callback = self.llama_runner_manager.get_runner_port
                ollama_app.state.request_runner_start_callback = self.llama_runner_manager.request_runner_start
                ollama_app.state.llama_runner_manager = self.llama_runner_manager
                # Start Ollama proxy server
                config = uvicorn.Config(
                    app=ollama_app,
                    host="127.0.0.1",
                    port=11434,
                    log_level="info"
                )
                server = uvicorn.Server(config)
                self.ollama_server = server
                # Create the task to serve the Ollama proxy and add it to the list
                ollama_task: asyncio.Task[None] = asyncio.create_task(server.serve()) # Explicitly type the task
                self.running_tasks.append(ollama_task) # Append the typed task
            except Exception as e:
                logger.error(f"Error configuring Ollama proxy: {e}")
                raise

        if self.lmstudio_proxy and self.llama_runner_manager:
            logger.info("Starting LM Studio proxy server...")
            # Configure the LMStudio app before starting
            try:
                lmstudio_app.state.all_models_config = self.models_specific_config
                lmstudio_app.state.get_runner_port_callback = self.llama_runner_manager.get_runner_port
                # Get runtimes configuration again, ensuring it's typed
                runtimes_config_for_lmstudio: Dict[str, Any] = self.app_config.get("llama-runtimes", {}) # Typed local var
                lmstudio_app.state.runtimes_config = runtimes_config_for_lmstudio # Assign typed var
                lmstudio_app.state.request_runner_start_callback = self.llama_runner_manager.request_runner_start
                lmstudio_app.state.is_model_running_callback = self.llama_runner_manager.is_llama_runner_running
                lmstudio_app.state.proxy_thread_instance = self.lmstudio_proxy
                lmstudio_app.state.llama_runner_manager = self.llama_runner_manager
                # Start LMStudio proxy server
                config = uvicorn.Config(
                    app=lmstudio_app,
                    host="127.0.0.1",
                    port=1234,
                    log_level="info"
                )
                server = uvicorn.Server(config)
                self.lmstudio_server = server
                # Create the task to serve the LM Studio proxy and add it to the list
                lmstudio_task: asyncio.Task[None] = asyncio.create_task(server.serve()) # Explicitly type the task
                self.running_tasks.append(lmstudio_task) # Append the typed task
            except Exception as e:
                logger.error(f"Error configuring LM Studio proxy: {e}")
                raise

        # Check if there are any tasks to wait for
        if self.running_tasks:
            logger.info("Waiting for all services to start...")
            try:
                # Wait for all server tasks to start (they run indefinitely until cancelled)
                await asyncio.gather(*self.running_tasks)
            except Exception as e:
                logger.error(f"Error starting services: {e}")
                # Ensure we try to stop everything if startup fails
                await self.stop_services()
                raise

    async def stop_services(self):
        """Stop all running services."""
        logger.info("Stopping all services...")
        # List to hold shutdown coroutines for uvicorn servers
        stop_tasks: List[Awaitable[None]] = [] # Type hint for stop_tasks list

        if self.ollama_server:
            logger.info("Stopping Ollama proxy server...")
            try:
                self.ollama_server.should_exit = True
                # Append the coroutine returned by shutdown() to the list
                # shutdown() returns an Awaitable (likely a Coroutine)
                ollama_shutdown_coro: Awaitable[None] = self.ollama_server.shutdown() # Explicitly type the coro
                stop_tasks.append(ollama_shutdown_coro) # Append the typed coroutine
            except Exception as e:
                logger.error(f"Error stopping Ollama proxy: {e}")

        if self.lmstudio_server:
            logger.info("Stopping LM Studio proxy server...")
            try:
                self.lmstudio_server.should_exit = True
                # Append the coroutine returned by shutdown() to the list
                # shutdown() returns an Awaitable (likely a Coroutine)
                lmstudio_shutdown_coro: Awaitable[None] = self.lmstudio_server.shutdown() # Explicitly type the coro
                stop_tasks.append(lmstudio_shutdown_coro) # Append the typed coroutine
            except Exception as e:
                logger.error(f"Error stopping LM Studio proxy: {e}")

        # Gather and await all server shutdown coroutines
        if stop_tasks:
            try:
                # Use return_exceptions=True to prevent one failure from stopping others
                await asyncio.gather(*stop_tasks, return_exceptions=True)
            except Exception as e:
                logger.error(f"Error during service shutdown: {e}")

        # Cancel any remaining running tasks (e.g., the uvicorn server.serve() tasks)
        # Check if the instance has the 'running_tasks' attribute and it's not empty
        if hasattr(self, 'running_tasks') and self.running_tasks:
            # Iterate over a copy of the list to avoid modification during iteration issues
            # although list iteration is generally safe in Python.
            # Type the task variable explicitly.
            task: asyncio.Task[None]
            for task in self.running_tasks: # Iterate over the typed list
                # Check if the task is not done before attempting to cancel
                if not task.done():
                    # Cancel the task
                    task.cancel()
            
            try:
                # Wait for all running tasks to finish cancellation
                # Use return_exceptions=True to handle CancelledError gracefully
                await asyncio.gather(*self.running_tasks, return_exceptions=True)
            except Exception as e:
                # Log any unexpected errors during task cancellation/waiting
                logger.error(f"Error canceling running tasks: {e}")
            # Clear the list of running tasks after cancellation
            self.running_tasks = []

        # Stop the LlamaRunnerManager itself (if needed for internal cleanup)
        # The actual stopping of individual llama runners is handled below.
        if self.llama_runner_manager:
            logger.info("Performing LlamaRunnerManager cleanup...") # Clarify log message
            try:
                # TODO: Add cleanup for llama runners once we have proper cleanup methods in RunnerService
                # For now, this pass is intentional placeholder.
                pass
            except Exception as e:
                logger.error(f"Error during LlamaRunnerManager cleanup: {e}") # Improved error message

        # Stop all individual llama runners managed by the LlamaRunnerManager
        if self.llama_runner_manager:
            logger.info("Stopping all Llama runners...") # Clarify log message
            try:
                # Call the async method to stop all llama runners
                await self.llama_runner_manager.stop_all_llama_runners_async()
            except Exception as e:
                logger.error(f"Error stopping all llama runners: {e}")

        # Clear server references to indicate they are stopped
        self.ollama_server = None
        self.lmstudio_server = None

        logger.info("All headless services stopped.")

