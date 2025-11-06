# 🏗️ LlamaRunner Pro - Architecture Guide

## Overview

This document describes the architecture, design patterns, and module relationships in LlamaRunner Pro, a comprehensive AI proxy and model management system.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LlamaRunner Pro                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Optional)                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Dashboard   │ │ Config      │ │    Web Interface       │ │
│  │ Vue.js App  │ │ Management  │ │   (Port 3000)         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Core Backend                                               │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │ Main Entry Point│    │     Headless Service Manager    │ │
│  │   (main.py)     │    │   (Service Orchestration)       │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Proxy Layer (Standalone Capable)                          │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │  Ollama Proxy   │    │    LM Studio Proxy              │ │
│  │  (Port 11434)   │    │    (Port 1234)                  │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Model Management                                           │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │ Llama Runner    │    │    Model Manager                │ │
│  │ Manager         │    │   (Configuration)               │ │
│  └─────────────────┘    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Entry Point (`main.py`)

**Responsibilities:**
- Application initialization and configuration loading
- Command-line argument parsing
- Environment detection (headless vs GUI)
- Service orchestration setup
- Logging configuration

**Key Features:**
- Supports both GUI and headless modes
- Validates configuration at startup
- Handles graceful shutdown with signal management
- Provides UTF-8 encoding support for internationalization

### 2. Headless Service Manager (`llama_runner/headless_service_manager.py`)

**Responsibilities:**
- Service lifecycle management
- Proxy server orchestration
- Resource allocation and cleanup
- Async service coordination

**Key Design Principles:**
- **Standalone Operation**: Can run without any UI components
- **Modular Services**: Each proxy can be enabled/disabled independently
- **Graceful Shutdown**: Proper resource cleanup and task cancellation
- **Error Isolation**: Service failures don't cascade to other components

### 3. Proxy Servers

#### Ollama Proxy (`llama_runner/ollama_proxy_thread.py`)
- **Port**: 11434
- **Protocol**: OpenAI-compatible API
- **Features**: 
  - Model lifecycle management
  - Request routing to running models
  - Audio transcription support
  - Response streaming

#### LM Studio Proxy (`llama_runner/lmstudio_proxy_thread.py`)
- **Port**: 1234
- **Protocol**: LM Studio compatible API
- **Features**:
  - Runtime configuration
  - Tool calling support
  - Model switching
  - Status monitoring

### 4. Model Management

#### Llama Runner Manager (`llama_runner/services/runner_service.py`)
- **Purpose**: Orchestrates multiple model instances
- **Features**:
  - Concurrent model management
  - Port allocation
  - Resource monitoring
  - Health checking

#### Model Configuration (`llama_runner/models/config_model.py`)
- **Purpose**: Type-safe configuration models
- **Features**:
  - Pydantic validation
  - Type hints for IDE support
  - Configuration inheritance

## Design Patterns

### 1. Service-Oriented Architecture (SOA)

Each major component is a self-contained service with well-defined interfaces:

```python
# Service Interface Example
class ProxyServer:
    async def start() -> None
    async def stop() -> None
    def is_running() -> bool
```

### 2. Dependency Injection

Configuration and callbacks are injected rather than hardcoded:

```python
def __init__(self, 
             get_runner_port_callback: Callable[[str], int],
             request_runner_start_callback: Callable[[str], Awaitable[bool]]):
    self.get_runner_port = get_runner_port_callback
    self.request_runner_start = request_runner_start_callback
```

### 3. Event-Driven Communication

Components communicate through callbacks and events:

```python
# Event callback example
def _on_port_ready(self, name: str, port: int):
    logger.info(f"Port {port} ready for {name}")
    # Trigger additional setup or notifications
```

### 4. Async/Await Pattern

All I/O operations use async/await for non-blocking operation:

```python
async def start_services(self):
    tasks = [
        asyncio.create_task(self.ollama_server.serve()),
        asyncio.create_task(self.lmstudio_server.serve())
    ]
    await asyncio.gather(*tasks)
```

## Data Flow

### Request Flow

```
Client Request → Proxy Server → Runner Manager → Model Instance
     ↓              ↓               ↓              ↓
  Response ←    Response ←     Response ←    Response
```

### Configuration Flow

```
Config File → Config Loader → Validation → Service Initialization
     ↓              ↓              ↓              ↓
   Runtime    ←    Applied ←   Verified ←   Services Ready
```

## Configuration Management

### Configuration Structure

```json
{
  "models": {
    "model_name": {
      "model_path": "path/to/model.gguf",
      "parameters": {...}
    }
  },
  "proxies": {
    "ollama": {"enabled": true},
    "lmstudio": {"enabled": true}
  },
  "audio": {
    "models": {...}
  }
}
```

### Environment-Specific Configurations

- **Development**: Full logging, debug endpoints
- **Production**: Optimized settings, security hardening
- **Testing**: Mock services, isolated instances

## Security Considerations

### 1. Network Security
- Proxies bind to localhost only (127.0.0.1)
- No external network exposure by default
- Optional CORS configuration for web interfaces

### 2. Data Privacy
- All processing happens locally
- No data transmission to external services
- Memory cleared after processing

### 3. Resource Protection
- Memory limits prevent system overload
- Concurrent request limits
- Model loading validation

## Deployment Patterns

### 1. Standalone Proxy (No Dashboard)

```bash
# Server deployment - proxies only
python main.py --headless --skip-validation
```

### 2. Full Stack with Dashboard

```bash
# Development or desktop usage
python main.py  # Starts GUI + proxies
```

### 3. Container Deployment

```dockerfile
FROM python:3.11-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "main.py", "--headless"]
```

## Performance Characteristics

### 1. Memory Usage
- Base system: ~150MB
- Per model: Model size + 500MB overhead
- Optimizations: Lazy loading, memory pooling

### 2. Startup Time
- Headless mode: ~2-3 seconds
- With GUI: ~5-7 seconds
- Model loading: 10-60 seconds (model dependent)

### 3. Throughput
- Concurrent requests: Unlimited (resource limited)
- Response latency: <100ms (excluding model inference)
- Audio processing: Real-time to 4x speed

## Extensibility

### Adding New Proxy Types

1. Create proxy server class inheriting from base interface
2. Implement required methods (start, stop, handle_request)
3. Register in HeadlessServiceManager
4. Add configuration options

### Adding New Model Types

1. Extend model configuration schema
2. Add model-specific parameters
3. Update validation rules
4. Add to model manager

### Custom Frontend Integration

The system provides REST APIs that any frontend can consume:

```javascript
// Example API integration
const response = await fetch('http://localhost:1234/v1/models');
const models = await response.json();
```

## Testing Architecture

### Unit Tests
- Component isolation testing
- Mock external dependencies
- Configuration validation tests

### Integration Tests
- Service interaction testing
- API endpoint validation
- Error handling scenarios

### End-to-End Tests
- Full workflow testing
- Real model loading
- Performance benchmarking

## Monitoring and Observability

### 1. Logging
- Structured logging with contextual information
- Different log levels for different environments
- File rotation and archival

### 2. Metrics
- Request latency tracking
- Memory usage monitoring
- Error rate monitoring

### 3. Health Checks
- Service availability endpoints
- Model status reporting
- Resource utilization tracking

## Future Architecture Considerations

### 1. Microservices Migration
- Service separation for scalability
- Message queue integration
- Distributed tracing

### 2. Plugin Architecture
- Dynamic module loading
- Custom model support
- Third-party integrations

### 3. Cloud Integration
- Multi-instance coordination
- Load balancing
- Distributed model serving
