# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Python-based async HTTP proxy system that forwards requests to Llama models, designed for integration with various LLM backends including Ollama and LM Studio. The system provides a unified interface between different AI model backends through an asynchronous Python proxy, paired with a Vue.js web dashboard for management and configuration.

## Key Technologies

- **Backend**: FastAPI with uvicorn for async HTTP handling
- **Frontend**: Vue.js 3 with Element Plus UI components
- **Model Support**: Llama.cpp (llama-server.exe), Ollama, LM Studio
- **Testing**: pytest
- **Monitoring**: psutil for system metrics collection

## Architecture Structure

The codebase is organized into several key components:

1. **app/** - FastAPI backend application with API routes and configuration
2. **llama_runner/** - Core Python backend module handling model management, proxy services, and runner logic
3. **config/** - Configuration files (app_config.json, models_config.json)
4. **scripts/** - PowerShell scripts for system management
4. **logs/** - Log file storage directory

## Main Modules

### App Layer (`app/`)
- `main.py` - Entry point for the FastAPI application
- `core/config.py` - Application settings configuration using Pydantic
- `api/v1/routers.py` - API routers for health, status, models, config, monitoring endpoints
- `api/v1/endpoints/` - Implementation of API endpoint handlers

### Core Runner Layer (`llama_runner/`)
- `config_loader.py` - Loads and validates application and model configurations
- `headless_service_manager.py` - Manages service lifecycle for Ollama and LM Studio proxies
- `services/runner_service.py` - Service that handles the lifecycle of Llama and Whisper runners
- `llama_cpp_runner.py` - Runner class for Llama.cpp models
- `faster_whisper_runner.py` - Runner class for FasterWhisper models
- `models/config_model.py` - Typed dictionaries for configuration structures

## Development Commands

### Running the Application
```bash
python app/main.py
```

### Testing
```bash
pytest tests/
```

### Linting
```bash
# Using black formatter
black .

# Using flake8 linter
flake8 .
```

## Key Configuration Files

- `config/app_config.json` - Main application configuration including proxy settings, webui settings, and metrics collection
- `config/models_config.json` - Model-specific configurations including runtime settings, model paths, and parameters

## Proxy Services

The system provides two main proxy services:
1. **Ollama Proxy** - Runs on port 11434
2. **LM Studio Proxy** - Runs on port 1234

## Key Components

### HeadlessServiceManager
- Manages the lifecycle of all services in headless mode
- Initializes and starts Ollama and LM Studio proxies
- Handles runner management for Llama.cpp models
- Provides metrics collection capabilities

### RunnerService
- Core service that manages LlamaCppRunner and FasterWhisperRunner instances
- Handles model startup, shutdown, and port assignment
- Implements concurrency limiting with semaphores
- Provides error handling and logging for runner operations

## Key Constants

- `LLAMA_SERVER_ABSOLUTE_PATH` - Path to the llama-server.exe binary (typically "F:\\llm\\llama\\llama-server.exe")
- `MODELS_ROOT_ABSOLUTE_PATH` - Root directory for LLM models (typically "F:\\llm\\llama\\models")

## Model Discovery

The system includes automatic model discovery capabilities that scan the models directory and update the models configuration accordingly.