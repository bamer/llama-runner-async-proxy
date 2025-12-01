# Llama Runner Async Proxy Documentation

## Launch Instructions

To launch the application, run:

```bash
/home/bamer/llama-runner-async-proxy/dev-venv/bin/python app/main.py
```

This will start the FastAPI server on port 8081 (default).

## Accessing Pages

### Monitoring Page
Access the monitoring page at:
```
http://localhost:8081/monitoring
```

### Model Configuration Page
Access the model configuration page at:
```
http://localhost:8081/
```

## Features

This application provides:

1. **Launch Entry Point**: Supports both Windows and Linux platforms
2. **Monitoring Interface**: Shows system status and available models
3. **Model Configuration**: Allows configuring parameters for available models

## Configuration Files

- `config/app_config.json`: Application configuration
- `config/models_config.json`: Model configuration  
- `config/metadata_cache/`: Metadata cache directory

## API Endpoints

to be completed

## Troubleshooting

If you encounter issues:
1. Ensure all dependencies are installed via `pip install -r requirements.txt`
2. Check that the configuration files exist in the config directory
3. Verify that required model directories exist
