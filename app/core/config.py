# app/core/config.py

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Llama Runner Management API"
    VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    RELOAD: bool = True  # Enable auto-reload for development
    # Add other settings as needed


settings = Settings()
