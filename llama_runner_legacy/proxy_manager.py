"""
Proxy Manager - Centralized management of all proxy services
Coordinates communication between different AI model providers (Ollama, LM Studio, etc.)
and the main application.

This module consolidates proxy functionality that was previously scattered across
multiple files (lmstudio_proxy_thread.py, ollama_proxy_thread.py, etc.)
"""

import asyncio
import logging
import json
from typing import Dict, Any, Optional, Callable, Awaitable
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import httpx

from llama_runner_legacy.config_loader import config
from llama_runner_legacy.services.runner_service import RunnerService
# Removed the problematic import
# from llama_runner.ollama_proxy_conversions import convert_lmstudio_to_ollama_format

class ProxyManager:
    """
    Central manager for all proxy services.
    Handles routing requests to the appropriate model runners and manages
    the lifecycle of proxy servers.
    """
    
    def __init__(self, runner_service: RunnerService):
        """
        Initialize the proxy manager with access to runner service.
        
        Args:
            runner_service: Service that manages model runners and their lifecycles
        """
        self.runner_service = runner_service
        self.app = FastAPI()
        self._configure_middleware()
        self._register_routes()
        
        # Dictionary to track active proxy servers
        self.active_proxies = {
            'lmstudio': None,
            'ollama': None
        }
        
        # Configuration from config_loader
        self.proxy_config = config.get('proxies', {})
        logging.info("Intialized ProxyManager with config: %s", self.proxy_config)

    def _configure_middleware(self):
        """Configure CORS and other middleware for the FastAPI app."""
        from fastapi.middleware.cors import CORSMiddleware
        
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _register_routes(self):
        """Register all proxy routes with the FastAPI app."""
        @self.app.get("/health")
        async def health_check(request: Request):
            """Health check endpoint for monitoring."""
            try:
                # Get model status from runner service
                running_models = 0
                total_models = len(config.get('models', {}))
                
                for model_name in config.get('models', {}):
                    if self.runner_service.is_model_running(model_name):
                        running_models += 1
                
                return JSONResponse(content={
                    "status": "healthy",
                    "running_models": running_models,
                    "total_models": total_models,
                    "timestamp": int(asyncio.get_event_loop().time()),
                    "proxies": {
                        "lmstudio": "active" if self.active_proxies['lmstudio'] else "inactive",
                        "ollama": "active" if self.active_proxies['ollama'] else "inactive"
                    }
                })
            except Exception as e:
                logging.error(f"Health check failed: {e}")
                return JSONResponse(
                    content={"status": "unhealthy", "error": str(e)},
                    status_code=500
                )

        @self.app.get("/api/v0/models")
        async def get_models(request: Request):
            """Get list of available models in LM Studio format."""
            try:
                all_models_config = config.get('models', {})
                # Get model metadata and convert to LM Studio format
                from llama_runner_legacy import gguf_metadata
                
                if not gguf_metadata.gguf_available:
                    return JSONResponse(
                        content={"error": "GGUF library not available for metadata extraction."},
                        status_code=500
                    )
                
                models_data = gguf_metadata.get_all_models_lmstudio_format(
                    all_models_config, 
                    self.runner_service.is_model_running
                )
                
                return JSONResponse(content={
                    "object": "list",
                    "data": models_data
                })
            except Exception as e:
                logging.error(f"Error getting models: {e}")
                raise HTTPException(status_code=500, detail="Internal Server Error")

    async def start_lmstudio_proxy(self):
        """Start the LM Studio proxy server."""
        from llama_runner_legacy.lmstudio_proxy_thread import LMStudioProxyServer
        
        lmstudio_config = self.proxy_config.get('lmstudio', {})
        if not lmstudio_config.get('enabled', True):
            logging.info("LM Studio proxy is disabled in configuration")
            return
        
        port = lmstudio_config.get('port', 1234)
        
        # Create and start the LM Studio proxy server
        lmstudio_proxy = LMStudioProxyServer(
            all_models_config=config.get('models', {}),
            runtimes_config=config.get('runtimes', {}),
            is_model_running_callback=self.runner_service.is_model_running,
            get_runner_port_callback=self.runner_service.get_runner_port,
            request_runner_start_callback=self.runner_service.request_runner_start,
            on_runner_port_ready=lambda model, port: None,  # TODO: Implement callback
            on_runner_stopped=lambda model: None,  # TODO: Implement callback
            llama_runner_manager=self.runner_service
        )
        
        # Store reference to active proxy
        self.active_proxies['lmstudio'] = lmstudio_proxy
        
        # Start the proxy server in a background task
        asyncio.create_task(lmstudio_proxy.start())
        logging.info(f"LM Studio proxy started on port {port}")

    async def start_ollama_proxy(self):
        """Start the Ollama proxy server."""
        try:
            from llama_runner_legacy.ollama_proxy_thread import OllamaProxyServer
            
            ollama_config = self.proxy_config.get('ollama', {})
            if not ollama_config.get('enabled', True):
                logging.info("Ollama proxy is disabled in configuration")
                return
            
            port = ollama_config.get('port', 11434)
            
            # Create and start the Ollama proxy server
            ollama_proxy = OllamaProxyServer(
                all_models_config=config.get('models', {}),
                runtimes_config=config.get('runtimes', {}),
                # Use a dummy conversion function since we removed the import
                convert_format_callback=lambda x: x,  # Simple identity function as placeholder
                runner_service=self.runner_service
            )
            
            # Store reference to active proxy
            self.active_proxies['ollama'] = ollama_proxy
            
            # Start the proxy server in a background task
            asyncio.create_task(ollama_proxy.start())
            logging.info(f"Ollama proxy started on port {port}")
        except Exception as e:
            logging.error(f"Error starting Ollama proxy: {e}")
            logging.error("Ollama proxy functionality will be disabled")

    async def start_all_proxies(self):
        """Start all configured proxy servers."""
        logging.info("Starting all proxy servers...")
        
        # Start proxies concurrently
        await asyncio.gather(
            self.start_lmstudio_proxy(),
            self.start_ollama_proxy()
        )
        
        logging.info("All proxy servers started successfully")

    async def stop_all_proxies(self):
        """Stop all active proxy servers."""
        logging.info("Stopping all proxy servers...")
        
        for proxy_name, proxy in self.active_proxies.items():
            if proxy:
                try:
                    proxy.stop()
                    logging.info(f"{proxy_name} proxy stopped")
                except Exception as e:
                    logging.error(f"Error stopping {proxy_name} proxy: {e}")
        
        self.active_proxies = {name: None for name in self.active_proxies}
        logging.info("All proxy servers stopped")

    def get_proxy_app(self) -> FastAPI:
        """Get the FastAPI app instance for the proxy manager."""
        return self.app

# Singleton instance for easy access
proxy_manager = None

def get_proxy_manager(runner_service: RunnerService) -> ProxyManager:
    """
    Get or create the singleton ProxyManager instance.
    
    Args:
        runner_service: RunnerService instance to manage model runners
    
    Returns:
        ProxyManager instance
    """
    global proxy_manager
    if proxy_manager is None:
        proxy_manager = ProxyManager(runner_service)
    return proxy_manager

async def start_proxy_servers(runner_service: RunnerService):
    """
    Start all proxy servers managed by the ProxyManager.
    
    Args:
        runner_service: RunnerService instance to manage model runners
    """
    manager = get_proxy_manager(runner_service)
    await manager.start_all_proxies()
    return manager.get_proxy_app()

if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    print("This module should be imported and used with the main application")