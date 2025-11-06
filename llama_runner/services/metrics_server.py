import asyncio
import json
import logging
import psutil
import time
from datetime import datetime
from typing import Dict, Set, Optional
from websockets.server import serve
from websockets.exceptions import ConnectionClosed
import threading

logger = logging.getLogger(__name__)

class MetricsServer:
    """WebSocket server for real-time system metrics streaming"""
    
    def __init__(self, port: int = 8585):
        self.port = port
        self.clients: Set = set()
        self.running = False
        self.server = None
        self.metrics_loop_task = None
        self._model_metrics = {}
        self._api_stats = {
            "totalRequests": 0,
            "requestsPerSecond": 0,
            "avgResponseTime": 0,
            "errorRate": 0,
            "requestTimestamps": []
        }
        
    async def register_client(self, websocket):
        """Register a new WebSocket client"""
        self.clients.add(websocket)
        logger.info(f"Client connected. Total clients: {len(self.clients)}")
        
    async def unregister_client(self, websocket):
        """Unregister a WebSocket client"""
        self.clients.discard(websocket)
        logger.info(f"Client disconnected. Total clients: {len(self.clients)}")
        
    def _get_model_metrics(self) -> Dict:
        """Get current model performance metrics"""
        return {
            model_id: {
                "requestsPerSecond": getattr(model, 'requests_per_second', 0),
                "avgResponseTime": getattr(model, 'avg_response_time', 0),
                "successRate": getattr(model, 'success_rate', 100),
                "memoryUsage": getattr(model, 'memory_usage', 0),
                "status": getattr(model, 'status', 'unknown')
            }
            for model_id, model in self._model_metrics.items()
        }
        
    def _update_api_stats(self, response_time: float, success: bool = True):
        """Update API statistics"""
        current_time = time.time()
        
        # Add timestamp for rate calculation
        self._api_stats["requestTimestamps"].append(current_time)
        
        # Remove timestamps older than 1 minute
        cutoff_time = current_time - 60
        self._api_stats["requestTimestamps"] = [
            t for t in self._api_stats["requestTimestamps"] if t > cutoff_time
        ]
        
        # Update metrics
        self._api_stats["totalRequests"] += 1
        self._api_stats["requestsPerSecond"] = len(self._api_stats["requestTimestamps"])
        
        # Update average response time
        if "responseTimes" not in self._api_stats:
            self._api_stats["responseTimes"] = []
        
        self._api_stats["responseTimes"].append(response_time)
        
        # Keep only last 100 response times
        if len(self._api_stats["responseTimes"]) > 100:
            self._api_stats["responseTimes"] = self._api_stats["responseTimes"][-100:]
        
        self._api_stats["avgResponseTime"] = sum(self._api_stats["responseTimes"]) / len(self._api_stats["responseTimes"])
        
        # Update error rate (simplified)
        total_responses = getattr(self, '_total_responses', 0) + 1
        error_responses = getattr(self, '_error_responses', 0) + (0 if success else 1)
        
        self._total_responses = total_responses
        self._error_responses = error_responses
        self._api_stats["errorRate"] = (error_responses / total_responses) * 100 if total_responses > 0 else 0
        
    async def collect_comprehensive_metrics(self) -> Dict:
        """Collect comprehensive system metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=None)
            cpu_count = psutil.cpu_count()
            load_avg = 0
            if hasattr(psutil, 'getloadavg'):
                try:
                    load_avg = psutil.getloadavg()[0]
                except:
                    pass
            
            # Memory metrics
            memory = psutil.virtual_memory()
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_io = psutil.disk_io_counters()
            
            # Network metrics
            network_io = psutil.net_io_counters()
            
            # GPU metrics (optional, only if GPUtil is available)
            gpu_info = await self._get_gpu_info()
            
            return {
                "timestamp": datetime.now().isoformat(),
                "cpuUsage": round(cpu_percent, 1),
                "cpuCores": cpu_count,
                "loadAverage": round(load_avg, 2),
                "memoryUsage": round(memory.percent, 1),
                "memoryUsed": memory.used,
                "memoryAvailable": memory.available,
                "memoryTotal": memory.total,
                "diskUsage": round((disk.used / disk.total) * 100, 1),
                "diskUsed": disk.used,
                "diskTotal": disk.total,
                "gpuUsage": gpu_info.get('usage', 0),
                "gpuInfo": gpu_info,
                "networkStats": {
                    "bytesInPerSecond": getattr(network_io, 'bytes_recv', 0),
                    "bytesOutPerSecond": getattr(network_io, 'bytes_sent', 0),
                    "packetsIn": getattr(network_io, 'packets_recv', 0),
                    "packetsOut": getattr(network_io, 'packets_sent', 0)
                },
                "diskStats": {
                    "readBytes": getattr(disk_io, 'read_bytes', 0) if disk_io else 0,
                    "writeBytes": getattr(disk_io, 'write_bytes', 0) if disk_io else 0
                },
                "modelMetrics": self._get_model_metrics(),
                "apiStats": self._api_stats.copy(),
                "systemInfo": {
                    "platform": psutil.os.name,
                    "bootTime": psutil.boot_time(),
                    "uptime": time.time() - psutil.boot_time()
                }
            }
            
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            return {}
            
    async def _get_gpu_info(self) -> Dict:
        """Get GPU information if available"""
        try:
            import GPUtil
            gpus = GPUtil.getGPUs()
            if gpus:
                gpu = gpus[0]  # Use first GPU
                return {
                    "id": gpu.id,
                    "name": gpu.name.strip(),
                    "usage": round(gpu.load * 100, 1),
                    "memoryUsed": gpu.memoryUsed * 1024 * 1024,  # Convert to bytes
                    "memoryTotal": gpu.memoryTotal * 1024 * 1024,
                    "temperature": gpu.temperature,
                    "memoryPercent": round((gpu.memoryUsed / gpu.memoryTotal) * 100, 1)
                }
        except ImportError:
            logger.debug("GPUtil not available, skipping GPU metrics")
        except Exception as e:
            logger.error(f"Error getting GPU info: {e}")
            
        return {}
        
    async def broadcast_metrics(self):
        """Broadcast metrics to all connected clients"""
        if not self.clients:
            return
            
        try:
            metrics = await self.collect_comprehensive_metrics()
            if not metrics:
                return
                
            message = json.dumps(metrics)
            
            # Create set of clients to remove (closed connections)
            to_remove = set()
            
            for client in self.clients:
                try:
                    await client.send(message)
                except ConnectionClosed:
                    to_remove.add(client)
                except Exception as e:
                    logger.warning(f"Error sending to client: {e}")
                    to_remove.add(client)
                    
            # Remove closed connections
            self.clients -= to_remove
            
        except Exception as e:
            logger.error(f"Error broadcasting metrics: {e}")
            
    async def handle_client(self, websocket, path):
        """Handle new client connection"""
        try:
            await self.register_client(websocket)
            await websocket.wait_closed()
        except Exception as e:
            logger.debug(f"Client handler error: {e}")
        finally:
            await self.unregister_client(websocket)
            
    async def metrics_loop(self):
        """Main metrics broadcast loop"""
        logger.info("Starting metrics broadcast loop")
        while self.running:
            try:
                await self.broadcast_metrics()
                await asyncio.sleep(2)  # Update every 2 seconds
            except Exception as e:
                logger.error(f"Error in metrics loop: {e}")
                await asyncio.sleep(5)
                
    async def start(self):
        """Start the metrics server"""
        if self.running:
            logger.warning("Metrics server is already running")
            return
            
        self.running = True
        logger.info(f"Starting metrics server on port {self.port}")
        
        try:
            # Start WebSocket server
            self.server = serve(self.handle_client, "127.0.0.1", self.port, max_size=2**20)
            
            # Start metrics broadcast loop
            self.metrics_loop_task = asyncio.create_task(self.metrics_loop())
            
            logger.info("Metrics server started successfully")
            
            # Wait for server to be ready
            async with self.server:
                await asyncio.gather(self.metrics_loop_task)
                
        except Exception as e:
            logger.error(f"Failed to start metrics server: {e}")
            self.running = False
            raise
            
    def stop(self):
        """Stop the metrics server"""
        if not self.running:
            return
            
        logger.info("Stopping metrics server...")
        self.running = False
        
        # Cancel metrics loop
        if self.metrics_loop_task:
            self.metrics_loop_task.cancel()
            
        # Close server
        if self.server:
            self.server.close()
            
        # Clear clients
        self.clients.clear()
        
        logger.info("Metrics server stopped")

# Global metrics server instance
_metrics_server: Optional[MetricsServer] = None

def start_metrics_server(port: int = 8585) -> MetricsServer:
    """Start the global metrics server"""
    global _metrics_server
    
    if _metrics_server and _metrics_server.running:
        logger.warning("Metrics server is already running")
        return _metrics_server
    
    _metrics_server = MetricsServer(port)
    
    # Start in background thread
    def run_server():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_metrics_server.start())
        except Exception as e:
            logger.error(f"Metrics server error: {e}")
        finally:
            loop.close()
    
    thread = threading.Thread(target=run_server, daemon=True)
    thread.start()
    
    # Wait a moment for server to start
    time.sleep(1)
    
    return _metrics_server

def stop_metrics_server():
    """Stop the global metrics server"""
    global _metrics_server
    
    if _metrics_server:
        _metrics_server.stop()
        _metrics_server = None

def get_metrics_server() -> Optional[MetricsServer]:
    """Get the global metrics server instance"""
    return _metrics_server

def record_api_call(response_time: float, success: bool = True):
    """Record an API call for statistics"""
    global _metrics_server
    
    if _metrics_server:
        _metrics_server._update_api_stats(response_time, success)

def register_model(model_id: str, model_instance):
    """Register a model for monitoring"""
    global _metrics_server
    
    if _metrics_server:
        _metrics_server._model_metrics[model_id] = model_instance

def unregister_model(model_id: str):
    """Unregister a model from monitoring"""
    global _metrics_server
    
    if _metrics_server:
        _metrics_server._model_metrics.pop(model_id, None)
