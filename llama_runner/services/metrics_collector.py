"""Runner metrics and monitoring."""
import time
from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# Global reference for FastAPI monitoring
GLOBAL_METRICS_COLLECTOR: Optional['MetricsCollector'] = None

@dataclass
class RunnerMetrics:
    """Metrics for a single runner."""
    model_name: str
    start_count: int = 0
    stop_count: int = 0
    error_count: int = 0
    total_startup_time: float = 0.0
    last_start_time: float = 0.0
    is_active: bool = False
    
    @property
    def average_startup_time(self) -> float:
        """Calculate average startup time in seconds."""
        if self.start_count == 0:
            return 0.0
        return self.total_startup_time / self.start_count

class MetricsCollector:
    """Collect and track metrics for all runners."""
    
    def __init__(self):
        self.metrics: Dict[str, RunnerMetrics] = {}
        self._global_start_time = time.time()
    
    def _get_or_create_metrics(self, model_name: str) -> RunnerMetrics:
        """Get or create metrics for a model."""
        if model_name not in self.metrics:
            self.metrics[model_name] = RunnerMetrics(model_name=model_name)
        return self.metrics[model_name]
    
    def record_start(self, model_name: str):
        """Record a runner start."""
        metrics = self._get_or_create_metrics(model_name)
        metrics.start_count += 1
        metrics.last_start_time = time.time()
        metrics.is_active = True
        
        logger.info(
            f"Runner started",
            extra={
                "model": model_name,
                "start_count": metrics.start_count,
                "metric_type": "runner_start"
            }
        )
    
    def record_ready(self, model_name: str, port: int):
        """Record when runner is ready."""
        metrics = self._get_or_create_metrics(model_name)
        if metrics.last_start_time > 0:
            startup_time = time.time() - metrics.last_start_time
            metrics.total_startup_time += startup_time
            
            logger.info(
                f"Runner ready",
                extra={
                    "model": model_name,
                    "port": port,
                    "startup_time_ms": int(startup_time * 1000),
                    "avg_startup_time_ms": int(metrics.average_startup_time * 1000),
                    "metric_type": "runner_ready"
                }
            )
    
    def record_stop(self, model_name: str):
        """Record a runner stop."""
        metrics = self._get_or_create_metrics(model_name)
        metrics.stop_count += 1
        metrics.is_active = False
        
        logger.info(
            f"Runner stopped",
            extra={
                "model": model_name,
                "stop_count": metrics.stop_count,
                "metric_type": "runner_stop"
            }
        )
    
    def record_error(self, model_name: str, error_message: str):
        """Record a runner error."""
        metrics = self._get_or_create_metrics(model_name)
        metrics.error_count += 1
        metrics.is_active = False
        
        logger.error(
            f"Runner error",
            extra={
                "model": model_name,
                "error_count": metrics.error_count,
                "error_message": error_message,
                "metric_type": "runner_error"
            }
        )
    
    def get_active_count(self) -> int:
        """Get count of currently active runners."""
        return sum(1 for m in self.metrics.values() if m.is_active)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary of all metrics."""
        return {
            "uptime_seconds": int(time.time() - self._global_start_time),
            "total_models": len(self.metrics),
            "active_runners": self.get_active_count(),
            "total_starts": sum(m.start_count for m in self.metrics.values()),
            "total_stops": sum(m.stop_count for m in self.metrics.values()),
            "total_errors": sum(m.error_count for m in self.metrics.values()),
            "models": {
                name: {
                    "starts": m.start_count,
                    "stops": m.stop_count,
                    "errors": m.error_count,
                    "avg_startup_ms": int(m.average_startup_time * 1000),
                    "active": m.is_active
                }
                for name, m in self.metrics.items()
            }
        }
    
    def log_summary(self):
        """Log a summary of metrics."""
        summary = self.get_summary()
        logger.info(
            f"Metrics summary",
            extra={
                "uptime_seconds": summary["uptime_seconds"],
                "active_runners": summary["active_runners"],
                "total_starts": summary["total_starts"],
                "total_errors": summary["total_errors"],
                "metric_type": "summary"
            }
        )
