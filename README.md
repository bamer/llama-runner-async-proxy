# Llama Runner Async Proxy Documentation

## Overview

This application is a lightweight, fast async HTTP proxy that forwards requests to Llama models. It provides real-time monitoring with detailed system information and supports multiple proxy emulators.

## Launch Instructions

To launch the application:

```bash
./launchapp
```

This will start the FastAPI server on port 8081 (default) with debug logging enabled.

## Dashboard Access

### Default Dashboard Page

The dashboard is automatically accessible at:
```
http://localhost:8081/
```

### Monitoring Interface

Access the monitoring interface at:
```
http://localhost:8081/monitoring
```

### Model Configuration Interface

Access the model configuration page at:
```
http://localhost:8081/
```

## Features Implemented

This application provides:

1. **Launch Entry Point**: Supports both Windows and Linux platforms
2. **Real-time Monitoring Dashboard**: Shows system status, active models, memory usage and load  
3. **Model Configuration**: Allows configuring parameters for available models
4. **Proxy Emulators**: Supports Ollama, LMStudio, and local llama.cpp proxy types

## Configuration Files

- `config/app_config.json`: Application configuration
- `config/models_config.json`: Model configuration  
- `config/metadata_cache/`: Metadata cache directory

## API Endpoints

### Monitoring Endpoint
```
GET /api/v1/monitoring/summary
```

### Models List Endpoint  
```
GET /api/v1/models
```

### Configuration Endpoint
```
POST /api/v1/config/{model_name}
```

## Logging System

The application implements automatic log rotation by default:

- Logs are written to `logs/app.log`
- Log files automatically rotate when they reach 5MB in size
- Old log files are compressed and stored with timestamped names
- Unused log files are cleaned up automatically

## Dashboard Features

### Main Dashboard Pages

1. **System Metrics**: Real-time display of uptime, active models, runners and error counts
2. **Active Models**: Shows currently running models with configuration details  
3. **System Status**: Displays memory usage, load average and other system information
4. **Model Configuration**: Configure proxy emulators for different model types

### Dashboard Access Options

- **Default Page**: http://localhost:8081/ (main dashboard)
- **Monitoring Page**: http://localhost:8081/monitoring (system metrics)
- **Configuration Page**: http://localhost:8081/ (model settings)

## Troubleshooting

If you encounter issues:

1. Ensure all dependencies are installed via `pip install -r requirements.txt`
2. Check that the configuration files exist in the config directory
3. Verify that required model directories exist
4. Run with debug mode for detailed console output: `./launchapp.sh`

## Technical Architecture

The application uses:
- FastAPI backend with WebSocket support
- React-based frontend dashboard
- Real-time data streaming for monitoring
- Modular architecture for easy extensibility