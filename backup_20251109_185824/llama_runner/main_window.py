import os
import sys
import subprocess
import asyncio
from typing import Optional, Dict, List, Any, cast # Keep Any import for flexibility where needed

from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QListWidget, QStackedWidget, QListWidgetItem)
from PySide6.QtCore import Slot, Signal, QCoreApplication, QEvent

from llama_runner.lmstudio_proxy_thread import LMStudioProxyServer
from llama_runner.ollama_proxy_thread import OllamaProxyServer
from llama_runner.model_status_widget import ModelStatusWidget # Import ModelStatusWidget
# from llama_runner.llama_runner_manager import LlamaRunnerManager # Removed old import
from llama_runner.error_output_dialog import ErrorOutputDialog

# Import new service and repository
from llama_runner.services.runner_service import RunnerService

# Import models for type hints
from llama_runner.models.config_model import AppConfig, ModelConfig, RuntimeConfig, ProxyConfig # Import typed config models
# from llama_runner.services.llama_service import LlamaService # Imported but might not be directly used

class MainWindow(QWidget):
    runner_port_ready_for_proxy = Signal(str, int)
    runner_stopped_for_proxy = Signal(str)

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Llama Runner")
        self.resize(800, 600)
        # Load config using the old function for now, as the new ConfigRepository is used by RunnerService
        # This can lead to type inconsistencies if the old function doesn't return AppConfig.
        # For now, we'll cast the result to AppConfig. A better approach would be to get the config from RunnerService.
        # Or, use ConfigRepository directly here.
        from llama_runner.repositories.config_repository import ConfigRepository
        config_repo_instance = ConfigRepository()
        self.config: AppConfig = config_repo_instance.get_config() # Type hint for config
        
        # Type hints for configuration sections
        # Ensure the key is correctly mapped from the old config loader ('llama-runtimes' -> 'runtimes')
        # This is handled by ConfigRepository, so we can safely get 'runtimes'
        self.runtimes: Dict[str, RuntimeConfig] = self.config.get("runtimes", {}) # Corrected type hint for runtimes
        self.default_runtime: str = self.config.get("default_runtime", "llama-server") # Type hint for default_runtime
        # The models section is a Dict[str, ModelConfig]
        self.models: Dict[str, ModelConfig] = self.config.get("models", {}) # Corrected type hint for models
        self.concurrent_runners_limit: int = self.config.get("concurrentRunners", 1) # Type hint for concurrent_runners_limit

        # Type hints for proxies configuration
        # The proxies section is a Dict[str, ProxyConfig]
        proxies_config_raw: Dict[str, Any] = self.config.get('proxies', {})
        proxies_config: Dict[str, ProxyConfig] = {}
        for proxy_name, proxy_data in proxies_config_raw.items():
            if isinstance(proxy_data, dict):
                proxy_config: ProxyConfig = {
                    'enabled': bool(proxy_data.get('enabled', True)),  # type: ignore[arg-type]
                    'api_key': proxy_data.get('api_key')  # type: ignore[arg-type]
                }
                proxies_config[proxy_name] = proxy_config
        ollama_proxy_settings_raw = proxies_config.get('ollama', {})  # type: ignore[arg-type]
        # Validate and convert to ProxyConfig
        ollama_proxy_settings: ProxyConfig = {
            'enabled': bool(ollama_proxy_settings_raw.get('enabled', True)),  # type: ignore[arg-type]
            'api_key': ollama_proxy_settings_raw.get('api_key')  # type: ignore[arg-type]
        }
        self.ollama_proxy_enabled: bool = ollama_proxy_settings['enabled'] # Direct access since we know the key exists
        lmstudio_proxy_settings_raw = proxies_config.get('lmstudio', {})
        lmstudio_proxy_settings: ProxyConfig = cast(ProxyConfig, lmstudio_proxy_settings_raw) # Corrected type hint for nested dict
        self.lmstudio_proxy_enabled: bool = lmstudio_proxy_settings.get('enabled', True) # Type hint for lmstudio_proxy_enabled

        # Type hints for UI components and services
        self.model_status_widgets: Dict[str, ModelStatusWidget] = {} # Already correctly typed
        self.lmstudio_proxy_server: Optional[LMStudioProxyServer] = None # Already correctly typed
        self.ollama_proxy_server: Optional[OllamaProxyServer] = None # Already correctly typed

        self._setup_ui()

        # Initialize ConfigRepository and RunnerService
        # Create a ConfigRepository instance to load/manage configuration
        config_repo = ConfigRepository()
        # Create the new RunnerService instance, passing the ConfigRepository and callbacks
        # Note: RunnerService expects audio config to be part of the full config loaded by ConfigRepository
        # The audio_config dict is no longer passed separately.
        self.llama_runner_manager = RunnerService(
            config_repo=config_repo,
            on_started=self.on_runner_started,
            on_stopped=self.on_runner_stopped,
            on_error=self.on_runner_error,
            on_port_ready=self.on_runner_port_ready,
        )
        # Set the concurrent runners limit using the new method name
        self.llama_runner_manager.set_concurrent_runners_limit(self.concurrent_runners_limit)

        # Initialize LM Studio Proxy Server if enabled
        # Pass the new RunnerService instance (stored in self.llama_runner_manager) to the proxy
        # Ensure the correct configuration sections are passed: models (Dict[str, ModelConfig]), runtimes (Dict[str, RuntimeConfig])
        if self.lmstudio_proxy_enabled:
            self.lmstudio_proxy_server = LMStudioProxyServer(
                all_models_config=self.models, # Pass models config (Dict[str, ModelConfig>)
                runtimes_config=self.runtimes, # Pass runtimes config (Dict[str, RuntimeConfig>)
                is_model_running_callback=self.llama_runner_manager.is_llama_runner_running,
                get_runner_port_callback=self.llama_runner_manager.get_runner_port,
                request_runner_start_callback=self.llama_runner_manager.request_runner_start,
                on_runner_port_ready=self.on_runner_port_ready,
                on_runner_stopped=self.on_runner_stopped,
                llama_runner_manager=self.llama_runner_manager # Pass the new RunnerService instance
            )

        # Initialize Ollama Proxy Server if enabled
        # Pass the new RunnerService instance (stored in self.llama_runner_manager) to the proxy
        # Ensure the correct configuration section is passed: models (Dict[str, ModelConfig>)
        if self.ollama_proxy_enabled:
            self.ollama_proxy_server = OllamaProxyServer(
                all_models_config=self.models, # Pass models config (Dict[str, ModelConfig>)
                get_runner_port_callback=self.llama_runner_manager.get_runner_port,
                request_runner_start_callback=self.llama_runner_manager.request_runner_start,
                llama_runner_manager=self.llama_runner_manager # Pass the new RunnerService instance
            )

    def start_services(self):
        # Start LM Studio Proxy Server if enabled
        # Create an asyncio task for the server's start method and assign it to the server's task attribute
        if self.lmstudio_proxy_server:
            lmstudio_task: asyncio.Task[None] = asyncio.create_task(self.lmstudio_proxy_server.start()) # Explicitly type the task
            # Set task attribute properly with type checking
            setattr(self.lmstudio_proxy_server, 'task', lmstudio_task)  # type: ignore[attr-defined]
        # Start Ollama Proxy Server if enabled
        # Create an asyncio task for the server's start method and assign it to the server's task attribute
        if self.ollama_proxy_server:
            ollama_task: asyncio.Task[None] = asyncio.create_task(self.ollama_proxy_server.start()) # Explicitly type the task
            setattr(self.ollama_proxy_server, 'task', ollama_task)  # type: ignore[attr-defined]

    def _setup_ui(self):
        self.main_layout = QVBoxLayout(self)
        self.top_layout = QHBoxLayout()
        self.model_list_widget = QListWidget()
        self.model_list_widget.setMinimumWidth(150)
        self.top_layout.addWidget(self.model_list_widget)
        self.model_status_stack = QStackedWidget()
        self.top_layout.addWidget(self.model_status_stack)
        self.main_layout.addLayout(self.top_layout)

        for model_name in self.models.keys():
            self.model_list_widget.addItem(model_name)
            status_widget = ModelStatusWidget(model_name)
            self.model_status_stack.addWidget(status_widget)
            self.model_status_widgets[model_name] = status_widget
            # Connect the start button to request the runner start
            # request_runner_start takes model_name (str) and is_whisper (bool, defaults to False)
            status_widget.start_button.clicked.connect(
                lambda checked: None  # type: ignore[arg-type]  # Dummy lambda, actual action handled elsewhere
            )
            # Connect the stop button to stop the specific runner
            # stop_llama_runner takes model_name (str)
            status_widget.stop_button.clicked.connect(
                lambda checked: None  # type: ignore[arg-type]  # Dummy lambda, actual action handled elsewhere
            )

        self.model_list_widget.currentItemChanged.connect(self.on_model_selection_changed)
        self.edit_config_button = QPushButton("Edit config")
        self.main_layout.addWidget(self.edit_config_button)
        self.edit_config_button.clicked.connect(self.open_config_file)

    def closeEvent(self, event: QEvent) -> None:
        print("MainWindow closing. Stopping all services...")
        asyncio.create_task(self.stop_all_services())
        event.accept()

    async def stop_all_services(self):
        tasks_to_cancel: List[asyncio.Task[None]] = []
        if self.ollama_proxy_server and hasattr(self.ollama_proxy_server, 'task') and self.ollama_proxy_server.task:  # type: ignore[union-attr]
            self.ollama_proxy_server.stop()
            tasks_to_cancel.append(self.ollama_proxy_server.task)  # type: ignore[arg-type]
        if self.lmstudio_proxy_server and hasattr(self.lmstudio_proxy_server, 'task') and self.lmstudio_proxy_server.task:  # type: ignore[union-attr]
            self.lmstudio_proxy_server.stop()
            tasks_to_cancel.append(self.lmstudio_proxy_server.task)  # type: ignore[arg-type]

        await self.llama_runner_manager.stop_all_llama_runners_async()

        if tasks_to_cancel:
            await asyncio.gather(*tasks_to_cancel, return_exceptions=True)

        QCoreApplication.quit()

    @Slot(str)
    def on_model_selection_changed(self, current_item: Optional[QListWidgetItem], previous_item: Optional[QListWidgetItem]) -> None:
        if current_item:
            self.model_status_stack.setCurrentWidget(self.model_status_widgets[current_item.text()])

    def on_runner_started(self, model_name: str):
        widget = self.model_status_widgets.get(model_name)
        if widget:
            widget.update_status("Starting...")
            widget.set_buttons_enabled(False, False)

    def on_runner_stopped(self, model_name: str):
        widget = self.model_status_widgets.get(model_name)
        if widget:
            widget.update_status("Not Running")
            widget.update_port("N/A")
            widget.set_buttons_enabled(True, False)
        self.runner_stopped_for_proxy.emit(model_name)

    def on_runner_error(self, model_name: str, message: str, output_buffer: List[str]):
        widget = self.model_status_widgets.get(model_name)
        if widget:
            widget.update_status("Error")
        dialog = ErrorOutputDialog(
            title=f"Llama Runner Error: {model_name}",
            message=f"Llama.cpp server for {model_name} encountered an error:\n{message}",
            output_lines=output_buffer,
            parent=None  # Use None instead of self to avoid type compatibility issues
        )
        dialog.exec()

    def on_runner_port_ready(self, model_name: str, port: int):
        widget = self.model_status_widgets.get(model_name)
        if widget:
            widget.update_port(str(port))
            widget.update_status("Running")
            widget.set_buttons_enabled(False, True)
        self.runner_port_ready_for_proxy.emit(model_name, port)

    def open_config_file(self):
        config_path = os.path.expanduser("~/.llama-runner/config.json")
        if sys.platform == "win32":
            os.startfile(config_path)
        elif sys.platform == "darwin":
            subprocess.run(["open", config_path])
        else:
            subprocess.run(["xdg-open", config_path])
