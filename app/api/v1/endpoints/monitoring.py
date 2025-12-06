# app/api/v1/endpoints/monitoring.py
import sys

sys.path.insert(0, "/home/bamer/llama-runner-async-proxy")

from fastapi import APIRouter
from typing import Dict, Any

# Import after path setup
from llama_runner_legacy.services.metrics_collector import MetricsCollector

router = APIRouter()

# Singleton collector
from llama_runner_legacy.services.metrics_collector import GLOBAL_METRICS_COLLECTOR

collector = GLOBAL_METRICS_COLLECTOR or MetricsCollector()


@router.get("/summary", summary="Get real‑time metrics summary")
async def get_summary() -> Dict[str, Any]:
    """Return current metrics snapshot."""
    # Get the summary from the collector
    summary = collector.get_summary()

    # Ensure we return a proper object structure even if null
    if not summary:
        return {
            "uptime": 0,
            "total_models": 0,
            "active_runners": 0,
            "total_starts": 0,
            "total_stops": 0,
            "total_errors": 0,
            "memory_usage": {"current": "N/A", "peak": "N/A"},
            "load_average": "N/A",
        }

    return summary
