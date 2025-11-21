# app/api/v1/endpoints/models.py

from fastapi import APIRouter

router = APIRouter()

# Placeholder for models-related endpoints
# e.g., @router.get("/models"), @router.post("/models/load"), etc.

@router.get("/models")
async def list_models():
    # TODO: Implement logic to list models
    return {"message": "List models endpoint - to be implemented"}
