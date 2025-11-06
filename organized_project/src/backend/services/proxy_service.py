"""
Proxy Service

Handles proxy-related functionality with separation of concerns:
- LM Studio and Ollama proxy endpoints
- Request routing and forwarding
- Model management
- Response processing
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from src.backend.services.service_manager import BaseService

logger = logging.getLogger(__name__)

class ProxyService(BaseService):
    """Service for managing AI model proxies"""
    
    def __init__(self, lm_studio_port: int = 1234, ollama_port: int = 11434, config: Optional[Dict[str, Any]] = None):
        super().__init__("proxy")
        self.lm_studio_port = lm_studio_port
        self.ollama_port = ollama_port
        self.config = config or {}
        self.running_proxies = {}
    
    async def start(self) -> None:
        """Start proxy services"""
        try:
            logger.info("🚀 Starting Proxy Service...")
            
            # Start LM Studio proxy if enabled
            if self.config.get("proxies", {}).get("lmstudio", {}).get("enabled", True):
                await self._start_lm_studio_proxy()
            
            # Start Ollama proxy if enabled
            if self.config.get("proxies", {}).get("ollama", {}).get("enabled", True):
                await self._start_ollama_proxy()
            
            self.is_running = True
            logger.info("✅ Proxy Service started successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to start Proxy Service: {e}")
            raise
    
    async def _start_lm_studio_proxy(self) -> None:
        """Start LM Studio compatible proxy"""
        logger.info(f"📡 Starting LM Studio proxy on port {self.lm_studio_port}")
        # TODO: Implement actual proxy logic
        self.running_proxies["lm_studio"] = {"port": self.lm_studio_port, "status": "running"}
    
    async def _start_ollama_proxy(self) -> None:
        """Start Ollama compatible proxy"""
        logger.info(f"🦙 Starting Ollama proxy on port {self.ollama_port}")
        # TODO: Implement actual proxy logic
        self.running_proxies["ollama"] = {"port": self.ollama_port, "status": "running"}
    
    async def stop(self) -> None:
        """Stop all proxy services"""
        logger.info("🛑 Stopping Proxy Service...")
        
        for proxy_name in list(self.running_proxies.keys()):
            logger.info(f"   Stopping {proxy_name} proxy")
            del self.running_proxies[proxy_name]
        
        self.is_running = False
        logger.info("✅ Proxy Service stopped")
    
    async def restart(self) -> None:
        """Restart proxy service"""
        await self.stop()
        await self.start()
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for proxy service"""
        base_health = await super().health_check()
        base_health.update({
            "lm_studio_port": self.lm_studio_port,
            "ollama_port": self.ollama_port,
            "running_proxies": len(self.running_proxies),
            "proxies": self.running_proxies
        })
        return base_health
    
    def get_proxy_status(self) -> Dict[str, Any]:
        """Get detailed proxy status"""
        return {
            "service_running": self.is_running,
            "proxies": self.running_proxies,
            "lm_studio_config": self.config.get("proxies", {}).get("lmstudio", {}),
            "ollama_config": self.config.get("proxies", {}).get("ollama", {})
        }
