# app/services/backend_service.py
# This service adapts components from the old llama_runner backend
# like HeadlessServiceManager, RunnerService, etc., for use with FastAPI.

import asyncio
from typing import Dict, Any
from app.utils.config import load_app_config_safe, load_models_config_safe
from llama_runner.headless_service_manager import HeadlessServiceManager # Import old manager
from llama_runner.services.metrics_collector import MetricsCollector


class BackendService:
    def __init__(self):
        # Load configurations using the new utility
        self.app_config = load_app_config_safe()
        self.models_config = load_models_config_safe()

        # Initialize the old HeadlessServiceManager
        # Note: This is a simplification. The old HSM might need to be adapted
        # to run within the new async context of FastAPI without blocking.
        # For now, we initialize it but don't start it here.
        self.old_manager = HeadlessServiceManager(self.app_config, self.models_config)

        # Access to old components
        self.metrics_collector = self.old_manager.metrics_collector
        self.ollama_proxy = self.old_manager.ollama_proxy
        self.lmstudio_proxy = self.old_manager.lmstudio_proxy
        self.runner_manager = self.old_manager.llama_runner_manager

    def get_status(self) -> Dict[str, Any]:
        # Example: Adapt status logic from old system
        # This is a placeholder, needs real implementation based on old logic
        active_runners = self.metrics_collector.get_active_count() if self.metrics_collector else 0
        return {
            "llamaRunner": active_runners > 0,
            "lmStudio": True,  # Assuming proxy is running
            "ollama": True,    # Assuming proxy is running
            "audioService": False,  # Not implemented in this example
            "system": {
                "cpu": 0, # Placeholder
                "memory": 0, # Placeholder
                "activeModels": active_runners,
            }
        }

    async def start_services_async(self):
        # This would be called at app startup
        # to start the old backend services
        # NOTE: This might require careful handling of the event loop
        # and ensuring the old sync/async patterns don't block FastAPI
        try:
            # This is potentially blocking if start_services is sync
            # In a real impl, this might need to be run in a threadpool
            # or the old HSM might need refactoring
            await asyncio.get_event_loop().run_in_executor(None, self.old_manager.start_services)
        except Exception as e:
            print(f"Error starting old backend services: {e}")
            raise

    async def stop_services_async(self):
        # This would be called at app shutdown
        try:
            await self.old_manager.stop_services()
        except Exception as e:
            print(f"Error stopping old backend services: {e}")
            raise


# Global instance of the service
# In a real app, dependency injection is preferred
# but for simplicity in this conversion, a global is used here.
backend_service = BackendService()
