# app/models/common.py

from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime: Optional[float] = None


class ErrorResponse(BaseModel):
    detail: str
