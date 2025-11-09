"""Real-time metrics server for system monitoring and WebSocket streaming."""
import asyncio
import json
import time
import logging
import psutil
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Set, Optional, List, Union, Awaitable
from dataclasses import dataclass, asdict
from websockets.server import serve, WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed
from llama_runner.patterns.circuit_breaker import CircuitBreaker, circuit_breaker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SystemMetrics:
    """System metrics data structure"""
    timestamp: float
    cpu_usage: float
    cpu_cores: int
    cpu_temperature: float
    memory_total: int
    memory_available: int
    memory_used: int
    memory_percentage: float
    disk_total: int
    disk_used: int
    disk_free: int
    disk_percentage: float
    network_bytes_sent: int
    network_bytes_recv: int
    processes_total: int
    processes_running: int

@dataclass
class ModelMetrics:
    """Model-specific metrics"""
    timestamp: float
    model_name: str
    total_requests: int
    total_tokens: int
    average_response_time: float
    error_rate: float
    active: bool
    memory_usage: int
    gpu_usage: float = 0.0

@dataclass
class ApiMetrics:
    """API endpoint metrics"""
    timestamp: float
    endpoint: str
    method: str
    total_requests: int
    successful_requests: int
    failed_requests: int
    average_response_time: float
    requests_per_minute: float
    status_codes: Dict[str, int]

class MetricsCollector:
    """Collects and processes system metrics"""
    
    def __init__(self, collection_interval: float = 1.0):
        self.collection_interval = collection_interval
        self.is_collecting = False
        self._collection_task: Optional[asyncio.Task] = None
        
        # Metrics storage
        self.current_metrics: Dict[str, Any] = {}
        self.metrics_history: list = []
        self.max_history_size = 1000
        
        # Circuit breakers for external service calls
        self.disk_io_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
        self.network_io_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30)
        self.temp_sensor_breaker = CircuitBreaker(failure_threshold=2, recovery_timeout=60)
        
    async def start_collection(self):
        """Start metrics collection"""
        if self.is_collecting:
            return
            
        self.is_collecting = True
        self._collection_task = asyncio.create_task(self._collect_loop())
        logger.info("Metrics collection started")
    
    async def stop_collection(self):
        """Stop metrics collection"""
        self.is_collecting = False
        
        if self._collection_task:
            self._collection_task.cancel()
            try:
                await self._collection_task
            except asyncio.CancelledError:
                pass
                
        logger.info("Metrics collection stopped")
    
    async def _collect_loop(self):
        """Main metrics collection loop"""
        while self.is_collecting:
            try:
                await self.collect_current_metrics()
                await asyncio.sleep(self.collection_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in metrics collection: {e}")
                await asyncio.sleep(self.collection_interval)
    
    @circuit_breaker(failure_threshold=3, recovery_timeout=30)
    async def _get_cpu_metrics(self) -> Dict[str, Union[float, int, Optional[float]]]:
        """Get CPU metrics with circuit breaker protection"""
        try:
            # CPU usage and cores
            cpu_percent = psutil.cpu_percent(interval=None)
            cpu_cores = psutil.cpu_count() or 1  # Default to 1 if None
            
            # CPU frequency (if available)
            cpu_freq = psutil.cpu_freq()
            cpu_frequency = cpu_freq.current if cpu_freq else 0.0
            
            # Try to get temperature (platform-specific)
            temperature: Optional[float] = None
            try:
                if hasattr(psutil, 'sensors_temperatures'):
                    temps = psutil.sensors_temperatures()
                    if temps:
                        # Get first available temperature sensor
                        for name, entries in temps.items():
                            if entries:
                                temperature = float(entries[0].current)
                                break
            except Exception:
                pass  # Temperature sensors not available
            
            return {
                'usage': float(cpu_percent),
                'cores': int(cpu_cores),
                'frequency': float(cpu_frequency),
                'temperature': temperature
            }
        except Exception as e:
            logger.warning(f"Failed to get CPU metrics: {e}")
            raise
    
    @circuit_breaker(failure_threshold=3, recovery_timeout=30)
    async def _get_memory_metrics(self) -> Dict[str, Union[int, float]]:
        """Get memory metrics with circuit breaker protection"""
        try:
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                'total': int(memory.total),
                'available': int(memory.available),
                'used': int(memory.used),
                'percentage': float(memory.percent),
                'cached': int(getattr(memory, 'cached', 0)),
                'buffers': int(getattr(memory, 'buffers', 0)),
                'swap_total': int(swap.total),
                'swap_used': int(swap.used),
                'swap_percentage': float(swap.percent)
            }
        except Exception as e:
            logger.warning(f"Failed to get memory metrics: {e}")
            raise
    
    @circuit_breaker(failure_threshold=3, recovery_timeout=30)
    async def _get_disk_metrics(self) -> Dict[str, Union[int, float]]:
        """Get disk metrics with circuit breaker protection"""
        try:
            disk_usage = psutil.disk_usage('/')
            disk_io = psutil.disk_io_counters()
            
            return {
                'total': int(disk_usage.total),
                'used': int(disk_usage.used),
                'free': int(disk_usage.free),
                'percentage': float((disk_usage.used / disk_usage.total) * 100),
                'read_bytes': int(disk_io.read_bytes) if disk_io else 0,
                'write_bytes': int(disk_io.write_bytes) if disk_io else 0
            }
        except Exception as e:
            logger.warning(f"Failed to get disk metrics: {e}")
            raise
    
    @circuit_breaker(failure_threshold=3, recovery_timeout=30)
    async def _get_network_metrics(self) -> Dict[str, int]:
        """Get network metrics with circuit breaker protection"""
        try:
            net_io = psutil.net_io_counters()
            
            return {
                'bytes_sent': int(net_io.bytes_sent) if net_io else 0,
                'bytes_recv': int(net_io.bytes_recv) if net_io else 0,
                'packets_sent': int(net_io.packets_sent) if net_io else 0,
                'packets_recv': int(net_io.packets_recv) if net_io else 0,
                'errors_in': int(net_io.errin) if net_io else 0,
                'errors_out': int(net_io.errout) if net_io else 0
            }
        except Exception as e:
            logger.warning(f"Failed to get network metrics: {e}")
            raise
    
    @circuit_breaker(failure_threshold=2, recovery_timeout=60)
    async def _get_process_metrics(self) -> Dict[str, Union[int, float]]:
        """Get process metrics with circuit breaker protection"""
        try:
            # Get all processes
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'status', 'cpu_percent', 'memory_percent']):
                try:
                    proc_info = proc.info
                    if proc_info['status'] == psutil.STATUS_RUNNING:
                        processes.append(proc_info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            total_processes = len(processes)
            running_processes = len([p for p in processes if p['status'] == 'running'])
            
            # Calculate aggregate CPU and memory usage
            total_cpu_percent = sum(p['cpu_percent'] for p in processes if p['cpu_percent'] is not None)
            total_memory_percent = sum(p['memory_percent'] for p in processes if p['memory_percent'] is not None)
            
            return {
                'total': int(total_processes),
                'running': int(running_processes),
                'sleeping': int(total_processes - running_processes),
                'cpu_percent': float(total_cpu_percent),
                'memory_percent': float(total_memory_percent)
            }
        except Exception as e:
            logger.warning(f"Failed to get process metrics: {e}")
            raise
    
    async def collect_current_metrics(self) -> Dict[str, Any]:
        """Collect all current metrics"""
        timestamp = time.time()
        metrics: Dict[str, Any] = {'timestamp': timestamp}
        
        try:
            # Collect metrics in parallel with circuit breaker protection
            cpu_task = self._get_cpu_metrics()
            memory_task = self._get_memory_metrics()
            disk_task = self._get_disk_metrics()
            network_task = self._get_network_metrics()
            process_task = self._get_process_metrics()
            
            # Wait for all metrics collection with error handling
            results = await asyncio.gather(
                cpu_task, memory_task, disk_task, network_task, process_task,
                return_exceptions=True
            )
            
            cpu_metrics, memory_metrics, disk_metrics, network_metrics, process_metrics = results
            
            # Process results, handling any failures
            if isinstance(cpu_metrics, Exception):
                logger.warning(f"CPU metrics collection failed: {cpu_metrics}")
                metrics['cpu'] = {'usage': 0.0, 'cores': 1, 'frequency': 0.0, 'temperature': None}
            else:
                metrics['cpu'] = cpu_metrics
                
            if isinstance(memory_metrics, Exception):
                logger.warning(f"Memory metrics collection failed: {memory_metrics}")
                metrics['memory'] = {'total': 0, 'available': 0, 'used': 0, 'percentage': 0.0}
            else:
                metrics['memory'] = memory_metrics
                
            if isinstance(disk_metrics, Exception):
                logger.warning(f"Disk metrics collection failed: {disk_metrics}")
                metrics['disk'] = {'total': 0, 'used': 0, 'free': 0, 'percentage': 0.0}
            else:
                metrics['disk'] = disk_metrics
                
            if isinstance(network_metrics, Exception):
                logger.warning(f"Network metrics collection failed: {network_metrics}")
                metrics['network'] = {'bytes_sent': 0, 'bytes_recv': 0}
            else:
                metrics['network'] = network_metrics
                
            if isinstance(process_metrics, Exception):
                logger.warning(f"Process metrics collection failed: {process_metrics}")
                metrics['processes'] = {'total': 0, 'running': 0}
            else:
                metrics['processes'] = process_metrics
            
            # Update current metrics and history
            self.current_metrics = metrics
            
            # Add to history (with size limit)
            self.metrics_history.append(metrics)
            if len(self.metrics_history) > self.max_history_size:
                self.metrics_history.pop(0)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to collect metrics: {e}")
            # Return basic fallback metrics
            return {
                'timestamp': timestamp,
                'cpu': {'usage': 0.0, 'cores': psutil.cpu_count() or 1, 'frequency': 0.0, 'temperature': None},
                'memory': {'total': 0, 'available': 0, 'used': 0, 'percentage': 0.0},
                'disk': {'total': 0, 'used': 0, 'free': 0, 'percentage': 0.0},
                'network': {'bytes_sent': 0, 'bytes_recv': 0},
                'processes': {'total': 0, 'running': 0}
            }
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """Get the most recent metrics"""
        return self.current_metrics.copy()
    
    def get_metrics_history(self, limit: int = 100) -> list:
        """Get metrics history"""
        return self.metrics_history[-limit:] if self.metrics_history else []
    
    def get_circuit_breaker_stats(self) -> Dict[str, Any]:
        """Get circuit breaker statistics"""
        return {
            'disk_io': self.disk_io_breaker.get_stats(),
            'network_io': self.network_io_breaker.get_stats(),
            'temp_sensor': self.temp_sensor_breaker.get_stats()
        }

class MetricsWebSocketServer:
    """WebSocket server for real-time metrics streaming"""
    
    def __init__(self, host: str = "localhost", port: int = 8585):
        self.host = host
        self.port = port
        self.server: WebSocketServerProtocol = None
        self.clients: Set[WebSocketServerProtocol] = set()
        self.metrics_collector = MetricsCollector()
        
        # Circuit breakers for server operations
        self.broadcast_breaker = CircuitBreaker(failure_threshold=10, recovery_timeout=10)
        
        # Subscription management
        self.client_subscriptions: Dict[WebSocketServerProtocol, Set[str]] = {}
    
    async def start_server(self):
        """Start the WebSocket server"""
        try:
            # Start metrics collection
            await self.metrics_collector.start_collection()
            
            # Start WebSocket server
            self.server = await serve(
                self.handle_client,
                self.host,
                self.port,
                ping_interval=20,
                ping_timeout=10,
                close_timeout=10
            )
            
            logger.info(f"Metrics WebSocket server started on {self.host}:{self.port}")
            
            # Start broadcast task
            asyncio.create_task(self.broadcast_metrics_loop())
            
        except Exception as e:
            logger.error(f"Failed to start metrics server: {e}")
            raise
    
    async def stop_server(self):
        """Stop the WebSocket server"""
        # Stop metrics collection
        await self.metrics_collector.stop_collection()
        
        # Close all client connections
        for client in self.clients.copy():
            await client.close()
        
        # Close server
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        
        logger.info("Metrics WebSocket server stopped")
    
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new client connection"""
        # Add client to set
        self.clients.add(websocket)
        self.client_subscriptions[websocket] = set(['system_metrics'])  # Default subscription
        
        logger.info(f"Client connected: {websocket.remote_address}")
        
        try:
            # Send initial metrics
            current_metrics = self.metrics_collector.get_current_metrics()
            if current_metrics:
                await self.send_to_client(websocket, {
                    'type': 'system_metrics',
                    'payload': current_metrics,
                    'timestamp': time.time()
                })
            
            # Send circuit breaker stats
            circuit_stats = self.metrics_collector.get_circuit_breaker_stats()
            await self.send_to_client(websocket, {
                'type': 'circuit_breaker_stats',
                'payload': circuit_stats,
                'timestamp': time.time()
            })
            
            # Handle client messages
            async for message in websocket:
                await self.handle_client_message(websocket, message)
                
        except ConnectionClosed:
            logger.info(f"Client disconnected: {websocket.remote_address}")
        except Exception as e:
            logger.error(f"Error handling client {websocket.remote_address}: {e}")
        finally:
            # Remove client
            self.clients.discard(websocket)
            self.client_subscriptions.pop(websocket, None)
            logger.info(f"Client removed: {websocket.remote_address}")
    
    async def handle_client_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            
            if msg_type == 'subscribe':
                # Client wants to subscribe to specific metrics
                metrics = data.get('metrics', [])
                if isinstance(metrics, str):
                    metrics = [metrics]
                self.client_subscriptions[websocket].update(metrics)
                
                await self.send_to_client(websocket, {
                    'type': 'subscription_confirmed',
                    'metrics': list(self.client_subscriptions[websocket]),
                    'timestamp': time.time()
                })
                
            elif msg_type == 'unsubscribe':
                # Client wants to unsubscribe from specific metrics
                metrics = data.get('metrics', [])
                if isinstance(metrics, str):
                    metrics = [metrics]
                self.client_subscriptions[websocket].difference_update(metrics)
                
                await self.send_to_client(websocket, {
                    'type': 'subscription_updated',
                    'metrics': list(self.client_subscriptions[websocket]),
                    'timestamp': time.time()
                })
                
            elif msg_type == 'request_metrics':
                # Client requests current metrics
                current_metrics = self.metrics_collector.get_current_metrics()
                await self.send_to_client(websocket, {
                    'type': 'system_metrics',
                    'payload': current_metrics,
                    'timestamp': time.time()
                })
                
            elif msg_type == 'request_history':
                # Client requests metrics history
                limit = data.get('limit', 100)
                history = self.metrics_collector.get_metrics_history(limit)
                await self.send_to_client(websocket, {
                    'type': 'metrics_history',
                    'payload': history,
                    'timestamp': time.time()
                })
                
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON from client {websocket.remote_address}: {message}")
        except Exception as e:
            logger.error(f"Error handling client message: {e}")
    
    @circuit_breaker(failure_threshold=10, recovery_timeout=10)
    async def send_to_client(self, websocket: WebSocketServerProtocol, data: Dict[str, Any]):
        """Send data to specific client with circuit breaker protection"""
        try:
            await websocket.send(json.dumps(data))
        except ConnectionClosed:
            # Client disconnected, will be cleaned up in handle_client
            pass
        except Exception as e:
            logger.error(f"Error sending to client {websocket.remote_address}: {e}")
            raise
    
    async def broadcast_metrics_loop(self):
        """Broadcast metrics to subscribed clients"""
        while True:
            try:
                # Get current metrics
                metrics = self.metrics_collector.get_current_metrics()
                
                if metrics and self.clients:
                    # Broadcast to clients based on subscriptions
                    await self.broadcast_to_subscribed_clients(metrics)
                
                await asyncio.sleep(1)  # Broadcast every second
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in broadcast loop: {e}")
                await asyncio.sleep(1)
    
    async def broadcast_to_subscribed_clients(self, metrics: Dict[str, Any]):
        """Broadcast metrics to clients based on their subscriptions"""
        disconnected_clients = []
        
        for client, subscriptions in self.client_subscriptions.items():
            if 'system_metrics' in subscriptions:
                try:
                    await self.send_to_client(client, {
                        'type': 'system_metrics',
                        'payload': metrics,
                        'timestamp': time.time()
                    })
                except Exception:
                    disconnected_clients.append(client)
        
        # Clean up disconnected clients
        for client in disconnected_clients:
            self.clients.discard(client)
            self.client_subscriptions.pop(client, None)
    
    def get_server_stats(self) -> Dict[str, Any]:
        """Get server statistics"""
        return {
            'host': self.host,
            'port': self.port,
            'connected_clients': len(self.clients),
            'clients': [
                {
                    'address': str(client.remote_address),
                    'subscriptions': list(self.client_subscriptions.get(client, set()))
                }
                for client in self.clients
            ],
            'metrics_collection': {
                'is_collecting': self.metrics_collector.is_collecting,
                'collection_interval': self.metrics_collector.collection_interval,
                'history_size': len(self.metrics_collector.metrics_history)
            },
            'circuit_breaker_stats': self.metrics_collector.get_circuit_breaker_stats()
        }

# Global metrics server instance
_metrics_server_instance = None

async def start_metrics_server(host: str = "localhost", port: int = 8585) -> MetricsWebSocketServer:
    """Start the global metrics server"""
    global _metrics_server_instance
    
    if _metrics_server_instance is None:
        _metrics_server_instance = MetricsWebSocketServer(host, port)
        await _metrics_server_instance.start_server()
    
    return _metrics_server_instance

async def stop_metrics_server():
    """Stop the global metrics server"""
    global _metrics_server_instance
    
    if _metrics_server_instance is not None:
        await _metrics_server_instance.stop_server()
        _metrics_server_instance = None

def get_metrics_server() -> Optional[MetricsWebSocketServer]:
    """Get the global metrics server instance"""
    return _metrics_server_instance

# Example usage and testing
if __name__ == "__main__":
    async def main():
        """Example usage of the metrics server"""
        server = await start_metrics_server("localhost", 8585)
        
        print("Metrics server started on ws://localhost:8585")
        print("Press Ctrl+C to stop")
        
        try:
            # Keep the server running
            while True:
                await asyncio.sleep(10)
                # Print server stats every 10 seconds
                stats = server.get_server_stats()
                print(f"Server stats: {stats}")
        except KeyboardInterrupt:
            print("\nShutting down server...")
        finally:
            await stop_metrics_server()
    
    # Run the example
    asyncio.run(main())
