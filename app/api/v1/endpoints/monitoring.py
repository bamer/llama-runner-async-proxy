from fastapi import APIRouter
from typing import Dict

from llama_runner.services.metrics_collector import MetricsCollector

router = APIRouter()

# Singleton collector
from llama_runner.services.metrics_collector import GLOBAL_METRICS_COLLECTOR

collector = GLOBAL_METRICS_COLLECTOR or MetricsCollector()

@router.get("/summary", summary="Get real‑time metrics summary")
async def get_summary() -> Dict[str, object]:
    """Return current metrics snapshot."""
    return collector.get_summary()
