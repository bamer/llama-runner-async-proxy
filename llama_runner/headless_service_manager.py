import logging
import asyncio
from typing import Dict, Any, List, Optional, Awaitable
import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse  # Correction ajoutée ici
from starlette.middleware.cors import CORSMiddleware

from llama_runner.services.runner_service import RunnerService as LlamaRunnerManager
from llama_runner.ollama_proxy_thread import OllamaProxyServer, app as ollama_app
from llama_runner.lmstudio_proxy_thread import LMStudioProxyServer, app as lmstudio_app
from llama_runner.models.config_model import AppConfig, ModelConfig, AudioConfig
from llama_runner.services.dashboard_api import initialize_dashboard_api
from llama_runner.services.metrics_collector import MetricsCollector

logger = logging.getLogger(__name__)

class HeadlessServiceManager:
    def __init__(self, app_config: AppConfig, model_config: Dict[str, ModelConfig]):
        self.app_config: AppConfig = app_config
        self.models_specific_config: Dict[str, ModelConfig] = model_config
        self.llama_runner_manager: LlamaRunnerManager | None = None
        self.ollama_proxy: OllamaProxyServer | None = None
        self.lmstudio_proxy: LMStudioProxyServer | None = None
        self.ollama_server: Optional[uvicorn.Server] = None
        self.lmstudio_server: Optional[uvicorn.Server] = None
        self.webui_server: Optional[uvicorn.Server] = None
        self.dashboard_api_server: Optional[uvicorn.Server] = None
        self.dashboard_api_service = None
        self.running_tasks: List[asyncio.Task[None]] = []
        self._initialize_services()

    def _on_runner_error(self, model_name: str, message: str, output_buffer: List[str]):
        logger.error(f"Runner error for {model_name}: {message}")

    def _on_runner_event(self, message: str):
        logger.info(f"Runner Manager Event: {message}")

    def _on_port_ready(self, name: str, port: int):
        logger.info(f"Port {port} ready for {name}")

    def _initialize_services(self):
        logger.info("Initializing services for headless mode...")
        
        # Get audio configuration
        audio_config_raw: Optional[AudioConfig] = self.app_config.get("audio")
        if audio_config_raw is None:
            logger.warning("Audio section is missing or None in config. Using empty models dict.")
            audio_config: AudioConfig = {"runtimes": {}, "models": {}}
        else:
            audio_config = audio_config_raw
        
        # Initialize LlamaRunnerManager
        from llama_runner.repositories.config_repository import ConfigRepository
        temp_config_repo = ConfigRepository()
        self.llama_runner_manager = LlamaRunnerManager(
            config_repo=temp_config_repo,
            on_started=lambda name: self._on_runner_event(f"Started {name}"),
            on_stopped=lambda name: self._on_runner_event(f"Stopped {name}"),
            on_error=self._on_runner_error,
            on_port_ready=self._on_port_ready,
        )
        logger.info("LlamaRunnerManager initialized.")

        # Initialize proxies
        proxies_config: Dict[str, Any] = self.app_config.get("proxies", {})
        
        # Ollama proxy
        ollama_proxy_settings: Dict[str, Any] = proxies_config.get("ollama", {})
        if ollama_proxy_settings.get("enabled", True):
            logger.info("Ollama Proxy is enabled. Creating server...")
            self.ollama_proxy = OllamaProxyServer(
                all_models_config=self.models_specific_config,
                get_runner_port_callback=self.llama_runner_manager.get_runner_port,
                request_runner_start_callback=self.llama_runner_manager.request_runner_start,
                llama_runner_manager=self.llama_runner_manager
            )

        # LM Studio proxy
        lmstudio_proxy_settings: Dict[str, Any] = proxies_config.get("lmstudio", {})
        if lmstudio_proxy_settings.get("enabled", True):
            logger.info("LM Studio Proxy is enabled. Creating server...")
            runtimes_config: Dict[str, Any] = self.app_config.get("llama-runtimes", {})
            self.lmstudio_proxy = LMStudioProxyServer(
                all_models_config=self.models_specific_config,
                runtimes_config=runtimes_config,
                get_runner_port_callback=self.llama_runner_manager.get_runner_port,
                request_runner_start_callback=self.llama_runner_manager.request_runner_start,
                is_model_running_callback=self.llama_runner_manager.is_llama_runner_running,
                on_runner_port_ready=self._on_port_ready,
                on_runner_stopped=lambda name: self._on_runner_event(f"Stopped {name}"),
                llama_runner_manager=self.llama_runner_manager
            )
        
        # Initialize metrics collector and dashboard API service
        from llama_runner.services.metrics_collector import MetricsCollector
        self.metrics_collector = MetricsCollector()
        self.dashboard_api_service = initialize_dashboard_api(
            runner_service=self.llama_runner_manager,
            metrics_collector=self.metrics_collector
        )

    async def start_services(self):
        """Start all initialized services."""
        logger.info("Starting all services...")
        self.running_tasks = []

        # Start Ollama proxy if configured
        if self.ollama_proxy and self.llama_runner_manager:
            logger.info("Starting Ollama proxy server...")
            try:
                ollama_app.state.get_runner_port_callback = self.llama_runner_manager.get_runner_port
                ollama_app.state.request_runner_start_callback = self.llama_runner_manager.request_runner_start
                ollama_app.state.llama_runner_manager = self.llama_runner_manager
                
                config = uvicorn.Config(
                    app=ollama_app,
                    host="0.0.0.0",
                    port=11434,
                    log_level="info"
                )
                server = uvicorn.Server(config)
                self.ollama_server = server
                self.running_tasks.append(asyncio.create_task(server.serve()))
                logger.info("✅ Ollama Proxy server started on http://0.0.0.0:11434/")
            except Exception as e:
                logger.error(f"Error configuring Ollama proxy: {e}")
                raise

        # Start LM Studio proxy if configured
        if self.lmstudio_proxy and self.llama_runner_manager:
            logger.info("Starting LM Studio proxy server...")
            try:
                lmstudio_app.state.all_models_config = self.models_specific_config
                lmstudio_app.state.get_runner_port_callback = self.llama_runner_manager.get_runner_port
                lmstudio_app.state.runtimes_config = self.app_config.get("llama-runtimes", {})
                lmstudio_app.state.request_runner_start_callback = self.llama_runner_manager.request_runner_start
                lmstudio_app.state.is_model_running_callback = self.llama_runner_manager.is_llama_runner_running
                lmstudio_app.state.proxy_thread_instance = self.lmstudio_proxy
                lmstudio_app.state.llama_runner_manager = self.llama_runner_manager
                
                config = uvicorn.Config(
                    app=lmstudio_app,
                    host="0.0.0.0",
                    port=1234,
                    log_level="info"
                )
                server = uvicorn.Server(config)
                self.lmstudio_server = server
                self.running_tasks.append(asyncio.create_task(server.serve()))
                logger.info("✅ LM Studio Proxy server started on http://0.0.0.0:1234/")
            except Exception as e:
                logger.error(f"Error configuring LM Studio proxy: {e}")
                raise

        # Start Dashboard API server
        if self.dashboard_api_service:
            logger.info("Starting Dashboard API server...")
            try:
                self.dashboard_api_server = self.dashboard_api_service.start(host="0.0.0.0", port=8585)
                self.running_tasks.append(asyncio.create_task(self.dashboard_api_server.serve()))
                logger.info("✅ Dashboard API server started on http://0.0.0.0:8585/")
            except Exception as e:
                logger.error(f"Error configuring Dashboard API: {e}")
                raise

        # OLD Llama Runner WebUI service on port 8081 - DEPRECATED AND REMOVED
        # This service has been replaced by the Vue.js dashboard on port 8035.
        

        # Wait for all services to start
        if self.running_tasks:
            logger.info("✅ All services started successfully. Waiting for shutdown signal...")
            logger.info("\n" + "="*60)
            logger.info("🌐 SERVICES ACCESSIBLES :")
            logger.info("="*60)
            logger.info("🏠 Dashboard Web: http://localhost:8080/")
            logger.info("   ✅ Direct access - Dashboard Web")
            logger.info("🔗 Dashboard API: http://localhost:8585/")
            logger.info("🔗 Ollama Proxy: http://localhost:11434/")
            logger.info("🔗 LM Studio Proxy: http://localhost:1234/")
            logger.info("="*60 + "\n")
            try:
                await asyncio.gather(*self.running_tasks)
            except Exception as e:
                logger.error(f"Error during service operation: {e}")
                await self.stop_services()
                raise

    async def stop_services(self):
        """Stop all running services."""
        logger.info("Stopping all services...")
        stop_tasks: List[Awaitable[None]] = []

        # Stop all servers
        for server, name in [
            (self.ollama_server, "Ollama proxy"),
            (self.lmstudio_server, "LM Studio proxy"),
            (self.dashboard_api_server, "Dashboard API"),
            (self.webui_server, "Llama Runner WebUI")
        ]:
            if server:
                logger.info(f"Stopping {name}...")
                try:
                    server.should_exit = True
                    stop_tasks.append(server.shutdown())
                except Exception as e:
                    logger.error(f"Error stopping {name}: {e}")

        # Wait for all servers to shut down
        if stop_tasks:
            try:
                await asyncio.gather(*stop_tasks, return_exceptions=True)
            except Exception as e:
                logger.error(f"Error during service shutdown: {e}")

        # Cancel remaining tasks
        for task in self.running_tasks:
            if not task.done():
                task.cancel()
        
        try:
            await asyncio.gather(*self.running_tasks, return_exceptions=True)
        except Exception as e:
            logger.error(f"Error canceling tasks: {e}")
        
        self.running_tasks = []

        # Stop Llama runners
        if self.llama_runner_manager:
            logger.info("Stopping all Llama runners...")
            try:
                await self.llama_runner_manager.stop_all_llama_runners_async()
            except Exception as e:
                logger.error(f"Error stopping llama runners: {e}")

        # Clean up references
        self.ollama_server = None
        self.lmstudio_server = None
        self.dashboard_api_server = None
        self.webui_server = None

        logger.info("✅ All headless services stopped successfully.")