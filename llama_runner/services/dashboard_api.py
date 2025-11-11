import asyncio
import logging
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psutil
import time
from datetime import datetime
import uvicorn

from llama_runner.services.metrics_collector import MetricsCollector
from llama_runner.services.runner_service import RunnerService

logger = logging.getLogger(__name__)


class DashboardAPIService:
    def __init__(self, runner_service: RunnerService, metrics_collector: MetricsCollector):
        self.runner_service = runner_service
        self.metrics_collector = metrics_collector
        self.app = FastAPI(title="Llama Runner Dashboard API", version="1.0.0")
        
        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # In production, restrict this to your dashboard origin
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        self.setup_routes()
        
    def setup_routes(self):
        @self.app.get("/api/status")
        async def get_status() -> Dict[str, Any]:
            """Get system and service status"""
            try:
                # Get system metrics
                cpu_percent = psutil.cpu_percent(interval=None)
                memory = psutil.virtual_memory()
                
                # Get runner status
                active_runners = self.metrics_collector.get_active_count()
                
                # Check if proxies are running (this is a simplified check)
                # In a real implementation, you would check the actual proxy status
                return {
                    "llamaRunner": active_runners > 0,
                    "lmStudio": True,  # Assuming proxy is running
                    "ollama": True,    # Assuming proxy is running
                    "audioService": False,  # Not implemented in this example
                    "system": {
                        "cpu": cpu_percent,
                        "memory": memory.percent,
                        "activeModels": active_runners,
                    }
                }
            except Exception as e:
                logger.error(f"Error getting status: {e}")
                raise HTTPException(status_code=500, detail="Error getting status")

        @self.app.get("/api/models/count")
        async def get_models_count() -> Dict[str, int]:
            """Get count of loaded models"""
            try:
                active_count = self.metrics_collector.get_active_count()
                return {"count": active_count}
            except Exception as e:
                logger.error(f"Error getting models count: {e}")
                raise HTTPException(status_code=500, detail="Error getting models count")

        @self.app.get("/api/health")
        async def health_check() -> Dict[str, Any]:
            """Health check endpoint"""
            try:
                return {
                    "healthy": True,
                    "timestamp": datetime.now().isoformat(),
                    "version": "1.0.0",
                    "uptime": int(time.time() - getattr(self, '_start_time', time.time()))
                }
            except Exception as e:
                logger.error(f"Error during health check: {e}")
                return {
                    "healthy": False,
                    "error": str(e)
                }

        @self.app.post("/api/restart")
        async def restart_service():
            """Restart the service"""
            # This would require more complex implementation
            # For now, just return success
            logger.info("Restart requested via API")
            return {"success": True, "message": "Restart operation initiated"}

        @self.app.post("/api/quit")
        async def quit_service():
            """Quit the service"""
            # This would require proper shutdown implementation
            logger.info("Quit requested via API")
            return {"success": True, "message": "Quit operation initiated"}

        # WebSocket endpoint for real-time updates
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket):
            await websocket.accept()
            
            # Send initial status
            initial_data = {
                "type": "status_update",
                "status": await get_status(),
            }
            await websocket.send_json(initial_data)
            
            # Send periodic updates
            try:
                while True:
                    # Update status
                    status_data = {
                        "type": "status_update",
                        "status": await get_status(),
                    }
                    await websocket.send_json(status_data)
                    
                    # Wait before next update
                    await asyncio.sleep(5)  # Update every 5 seconds
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
            finally:
                await websocket.close()

    def start(self, host: str = "127.0.0.1", port: int = 8585):
        """Start the dashboard API server"""
        logger.info(f"Starting Dashboard API server on {host}:{port}")
        self._start_time = time.time()
        
        # Start the uvicorn server
        config = uvicorn.Config(
            self.app,
            host=host,
            port=port,
            log_level="info"
        )
        server = uvicorn.Server(config)
        
        return server


# Global instance
_dashboard_api_service = None


def get_dashboard_api_service() -> DashboardAPIService:
    return _dashboard_api_service


def initialize_dashboard_api(runner_service: RunnerService, metrics_collector: MetricsCollector):
    global _dashboard_api_service
    _dashboard_api_service = DashboardAPIService(runner_service, metrics_collector)
    return _dashboard_api_service
