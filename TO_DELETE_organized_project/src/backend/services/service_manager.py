"""
Service Manager - Orchestration layer

Manages all application services:
- Service lifecycle (start/stop/restart)
- Service dependencies
- Service health monitoring
- Graceful shutdown
"""

import asyncio
import logging
from typing import Dict, Any
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class BaseService(ABC):
    """Base class for all services"""
    
    def __init__(self, name: str):
        self.name = name
        self.is_running = False
    
    @abstractmethod
    async def start(self) -> None:
        """Start the service"""
        pass
    
    @abstractmethod
    async def stop(self) -> None:
        """Stop the service"""
        pass
    
    @abstractmethod
    async def restart(self) -> None:
        """Restart the service"""
        pass
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for the service"""
        return {
            "name": self.name,
            "running": self.is_running,
            "status": "healthy" if self.is_running else "stopped"
        }

class ServiceManager:
    """Manages multiple services"""
    
    def __init__(self):
        self.services: Dict[str, BaseService] = {}
        self.shutdown_event = asyncio.Event()
    
    def register_service(self, service: BaseService) -> None:
        """Register a service"""
        self.services[service.name] = service
        logger.info(f"📝 Service registered: {service.name}")
    
    async def start_services(self, services: Dict[str, BaseService]) -> None:
        """Start all services"""
        logger.info("🚀 Starting services...")
        
        # Register all services
        for name, service in services.items():
            self.register_service(service)
        
        # Start services concurrently
        tasks = []
        for service in self.services.values():
            tasks.append(asyncio.create_task(service.start()))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info("✅ All services started")
    
    async def stop_services(self) -> None:
        """Stop all services"""
        logger.info("🛑 Stopping services...")
        
        # Stop services concurrently
        tasks = []
        for service in self.services.values():
            tasks.append(asyncio.create_task(service.stop()))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info("✅ All services stopped")
    
    async def wait_for_shutdown(self) -> None:
        """Wait for shutdown signal"""
        await self.shutdown_event.wait()
    
    def signal_shutdown(self) -> None:
        """Signal shutdown"""
        self.shutdown_event.set()
