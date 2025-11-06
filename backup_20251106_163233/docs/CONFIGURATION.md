# ⚙️ Configuration Guide - LlamaRunner Pro

## Overview

This guide covers all configuration options available in LlamaRunner Pro, from basic setup to advanced performance tuning.

## Configuration File Structure

The main configuration file is located at:
- **Linux/MacOS**: `~/.llama-runner/config.json`
- **Windows**: `%USERPROFILE%\.llama-runner\config.json`

### Default Configuration Structure

```json
{
  "version": "1.0",
  "models": {},
  "llama-runtimes": {
    "default": {
      "runtime": "llama-server"
    }
  },
  "proxies": {
    "ollama": {
      "enabled": true,
      "port": 11434,
      "host": "127.0.0.1"
    },
    "lmstudio": {
      "enabled": true,
      "port": 1234,
      "host": "127.0.0.1",
      "api_key": null,
      "cors_enabled": true
    }
  },
  "concurrentRunners": 1,
  "audio": {
    "enabled": true,
    "models": {}
  },
  "security": {
    "authentication": {
      "enabled": false
    },
    "rate_limit": {
      "requests_per_minute": 100
    },
    "cors_origins": ["http://localhost:8080", "http://localhost:3000"]
  }
}
```

## Model Configuration

### Basic Model Setup

```json
{
  "models": {
    "qwen2.5-7b-instruct": {
      "model_path": "/path/to/model.gguf",
      "llama_cpp_runtime": "default",
      "parameters": {
        "ctx_size": 16000,
        "n_gpu_layers": 50,
        "temp": 0.6,
        "top_p": 0.95,
        "top_k": 20,
        "repeat_penalty": 1.2,
        "batch_size": 2048,
        "threads": 6
      }
    }
  }
}
```

### Parameter Reference

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ctx_size` | int | 16000 | Context window size (tokens) |
| `n_gpu_layers` | int | 0 | GPU layers (-1 for auto, 0 for CPU-only) |
| `temp` | float | 0.7 | Sampling temperature (0.0-2.0) |
| `top_p` | float | 0.9 | Nucleus sampling threshold |
| `top_k` | int | 40 | Top-k sampling |
| `repeat_penalty` | float | 1.1 | Repetition penalty |
| `batch_size` | int | 512 | Processing batch size |
| `threads` | int | 0 | CPU threads (0 for auto) |

### Multi-Model Configuration

```json
{
  "models": {
    "qwen2.5-7b-instruct": {
      "model_path": "/models/qwen2.5-7b-instruct-q4_k_m.gguf",
      "llama_cpp_runtime": "default",
      "parameters": {
        "ctx_size": 16000,
        "n_gpu_layers": 35,
        "temp": 0.6
      }
    },
    "code-llama-13b": {
      "model_path": "/models/code-llama-13b-instruct-q4_k_m.gguf",
      "llama_cpp_runtime": "default",
      "parameters": {
        "ctx_size": 32000,
        "n_gpu_layers": 40,
        "temp": 0.1,
        "top_k": 10
      }
    },
    "mistral-7b": {
      "model_path": "/models/mistral-7b-instruct-v0.2-q4_k_m.gguf",
      "llama_cpp_runtime": "default",
      "parameters": {
        "ctx_size": 8000,
        "n_gpu_layers": 25,
        "temp": 0.4,
        "top_p": 0.9
      }
    }
  }
}
```

### Runtime Configuration

```json
{
  "llama-runtimes": {
    "default": {
      "runtime": "llama-server",
      "timeout": 300
    },
    "high-performance": {
      "runtime": "/usr/local/bin/llama-server-optimized",
      "supports_tools": true,
      "timeout": 600,
      "priority": "high"
    },
    "cpu-optimized": {
      "runtime": "llama-server",
      "args": ["--cpu", "--optimize"]
    }
  }
}
```

## Proxy Configuration

### Ollama Proxy

```json
{
  "proxies": {
    "ollama": {
      "enabled": true,
      "port": 11434,
      "host": "127.0.0.1",
      "log_level": "info",
      "rate_limits": {
        "requests_per_minute": 100,
        "concurrent_requests": 10
      },
      "cors_enabled": true,
      "cors_origins": ["*"],
      "health_check": {
        "enabled": true,
        "interval": 30
      }
    }
  }
}
```

### LM Studio Proxy

```json
{
  "proxies": {
    "lmstudio": {
      "enabled": true,
      "port": 1234,
      "host": "127.0.0.1",
      "log_level": "info",
      "api_key": "sk-your-api-key-here",
      "cors_enabled": true,
      "cors_origins": [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://your-app.com"
      ],
      "rate_limits": {
        "requests_per_minute": 200,
        "concurrent_requests": 15,
        "file_upload_size_mb": 100
      },
      "features": {
        "tools": true,
        "streaming": true,
        "embeddings": true,
        "audio": true
      },
      "timeout": {
        "request": 300,
        "upload": 600
      }
    }
  }
}
```

### Proxy-Specific Features

#### Tool Calling Support

```json
{
  "proxies": {
    "lmstudio": {
      "enabled": true,
      "tools": {
        "enabled": true,
        "allowed_functions": [
          "get_weather",
          "search_web",
          "calculator"
        ],
        "max_function_calls": 5
      }
    }
  }
}
```

#### Streaming Configuration

```json
{
  "proxies": {
    "lmstudio": {
      "streaming": {
        "enabled": true,
        "chunk_size": 2048,
        "heartbeat_interval": 15,
        "max_duration": 300
      }
    }
  }
}
```

## Audio Configuration

### faster-whisper Setup

```json
{
  "audio": {
    "enabled": true,
    "models": {
      "whisper-tiny": {
        "model_path": "tiny",
        "enabled": true,
        "parameters": {
          "device": "cpu",
          "compute_type": "int8",
          "threads": 4,
          "language": null,
          "beam_size": 5,
          "best_of": 5,
          "temperature": 0.0,
          "condition_on_previous_text": true,
          "fp16": false,
          "compression_ratio_threshold": 2.4,
          "logprob_threshold": -1.0,
          "no_speech_threshold": 0.6
        }
      },
      "whisper-base": {
        "model_path": "base",
        "enabled": true,
        "parameters": {
          "device": "cpu",
          "compute_type": "int8",
          "threads": 6,
          "language": null,
          "beam_size": 5,
          "fp16": false
        }
      },
      "whisper-small": {
        "model_path": "small",
        "enabled": true,
        "parameters": {
          "device": "cpu",
          "compute_type": "int8",
          "threads": 6,
          "language": "fr",
          "beam_size": 5
        }
      }
    },
    "servers": {
      "audio_proxy": {
        "port": 9000,
        "enabled": false
      }
    }
  }
}
```

### Model Sizes and Performance

| Model | Size | Speed | Accuracy | VRAM Usage |
|-------|------|-------|----------|------------|
| tiny | 39 MB | ⚡⚡⚡⚡⚡ | ⭐⭐ | 0.4 GB |
| base | 74 MB | ⚡⚡⚡⚡ | ⭐⭐⭐ | 0.5 GB |
| small | 244 MB | ⚡⚡⚡ | ⭐⭐⭐⭐ | 0.7 GB |
| medium | 769 MB | ⚡⚡ | ⭐⭐⭐⭐⭐ | 1.0 GB |
| large | 1550 MB | ⚡ | ⭐⭐⭐⭐⭐ | 1.4 GB |

### Audio Processing Configuration

```json
{
  "audio": {
    "processing": {
      "max_file_size_mb": 500,
      "supported_formats": ["wav", "mp3", "m4a", "ogg", "flac"],
      "sample_rate": 16000,
      "channels": 1,
      "chunk_duration": 30,
      "overlap": 1
    },
    "transcription": {
      "default_model": "whisper-base",
      "max_duration_seconds": 3600,
      "output_format": "json",
      "include_timestamps": true,
      "include_segments": true,
      "diarization": false,
      "vad_filter": true
    }
  }
}
```

## Security Configuration

### Authentication Setup

```json
{
  "security": {
    "authentication": {
      "enabled": true,
      "method": "api_key", // api_key, oauth, jwt
      "api_keys": [
        {
          "key": "sk-1234567890abcdef",
          "name": "Default User",
          "scopes": ["chat", "audio"],
          "rate_limit": 1000
        }
      ],
      "oauth": {
        "provider": "generic",
        "client_id": "your-client-id",
        "client_secret": "your-client-secret"
      }
    },
    "rate_limit": {
      "enabled": true,
      "requests_per_minute": 100,
      "burst_limit": 10,
      "whitelist": ["127.0.0.1", "::1"],
      "blacklist": []
    },
    "cors": {
      "enabled": true,
      "origins": [
        "http://localhost:3000",
        "https://your-domain.com"
      ],
      "methods": ["GET", "POST", "PUT", "DELETE"],
      "headers": ["Content-Type", "Authorization"],
      "credentials": true
    }
  }
}
```

### Network Security

```json
{
  "security": {
    "network": {
      "bind_address": "127.0.0.1",
      "allow_external": false,
      "ssl": {
        "enabled": false,
        "cert_file": "/path/to/cert.pem",
        "key_file": "/path/to/key.pem"
      },
      "proxy_headers": {
        "enabled": true,
        "trusted_proxies": ["127.0.0.1"]
      }
    },
    "data": {
      "clear_on_exit": true,
      "encryption": {
        "enabled": false,
        "key_rotation_days": 30
      }
    }
  }
}
```

## Performance Tuning

### Memory Optimization

```json
{
  "performance": {
    "memory": {
      "max_model_memory_mb": 8192,
      "model_cache_size": 2,
      "gc_threshold": 0.8,
      "swap_enabled": false,
      "memory_mapped_files": true
    },
    "cpu": {
      "threads_auto": true,
      "max_threads": 16,
      "thread_priority": "normal",
      "affinity": false
    },
    "storage": {
      "model_cache_dir": "/tmp/llama-cache",
      "temp_dir": "/tmp/llama-temp",
      "auto_cleanup": true,
      "cleanup_interval_hours": 24
    }
  }
}
```

### Concurrent Management

```json
{
  "performance": {
    "concurrency": {
      "max_concurrent_models": 3,
      "max_concurrent_requests": 10,
      "request_queue_size": 100,
      "timeout_seconds": 300,
      "graceful_shutdown_timeout": 30
    }
  }
}
```

### GPU Configuration

```json
{
  "performance": {
    "gpu": {
      "preferred_device": "auto", // auto, cpu, cuda:0, cuda:1
      "memory_fraction": 0.8,
      "allow_growth": true,
      "multi_gpu": false,
      "gpu_layers_auto": true,
      "flash_attention": true,
      "metal_performance_shaders": true
    }
  }
}
```

## Environment-Specific Configurations

### Development Configuration

```json
{
  "environment": "development",
  "logging": {
    "level": "DEBUG",
    "console": true,
    "file": true,
    "file_path": "/tmp/llama-runner-dev.log"
  },
  "features": {
    "debug_endpoints": true,
    "profiling": true,
    "hot_reload": true
  },
  "performance": {
    "lazy_loading": false,
    "preload_models": true
  }
}
```

### Production Configuration

```json
{
  "environment": "production",
  "logging": {
    "level": "INFO",
    "console": false,
    "file": true,
    "file_path": "/var/log/llama-runner.log",
    "rotation": {
      "max_size_mb": 100,
      "backup_count": 5
    }
  },
  "security": {
    "authentication": {
      "enabled": true
    },
    "rate_limit": {
      "requests_per_minute": 1000
    }
  },
  "performance": {
    "lazy_loading": true,
    "preload_models": false,
    "memory_optimization": true
  }
}
```

### Docker Configuration

```json
{
  "environment": "docker",
  "models": {
    "auto_discover": true,
    "models_dir": "/models"
  },
  "logging": {
    "level": "INFO",
    "format": "json"
  },
  "security": {
    "authentication": {
      "enabled": false
    },
    "rate_limit": {
      "requests_per_minute": 500
    }
  }
}
```

## Advanced Configuration

### Plugin Configuration

```json
{
  "plugins": {
    "enabled": true,
    "directories": [
      "/usr/local/lib/llama-runner/plugins",
      "/home/user/.llama-runner/plugins"
    ],
    "plugins": {
      "custom-text-generator": {
        "enabled": true,
        "path": "/plugins/custom-text-generator.so",
        "config": {
          "model_endpoint": "http://custom-service:8080",
          "timeout": 30
        }
      }
    }
  }
}
```

### Custom Model Formats

```json
{
  "model_formats": {
    "gguf": {
      "enabled": true,
      "supported_quantizations": ["q4_k_m", "q5_k_m", "q8_0"]
    },
    "safetensors": {
      "enabled": true,
      "preferred": false
    }
  }
}
```

### Monitoring and Metrics

```json
{
  "monitoring": {
    "enabled": true,
    "metrics": {
      "collect_interval_seconds": 30,
      "retention_days": 30,
      "export_format": "prometheus"
    },
    "health_checks": {
      "enabled": true,
      "endpoint": "/health",
      "interval_seconds": 60
    },
    "alerts": {
      "enabled": true,
      "webhook_url": "https://your-monitoring.com/webhook",
      "conditions": {
        "memory_usage_percent": 90,
        "cpu_usage_percent": 95,
        "response_time_ms": 5000
      }
    }
  }
}
```

## Configuration Validation

### Schema Validation

LlamaRunner Pro uses JSON Schema for configuration validation:

```python
# Validate configuration
from llama_runner.config_validator import validate_config

errors = validate_config(config_dict)
if errors:
    print("Configuration errors:", errors)
```

### Configuration Testing

```bash
# Test configuration without starting services
python main.py --skip-validation --dry-run

# Validate configuration file
python -c "from llama_runner.config_validator import validate_config; print(validate_config(load_config()))"
```

## Configuration Migration

### Automatic Updates

```bash
# Update configuration with migrations
python main.py --update-config

# Backup before updating
python main.py --update-config --backup-config
```

### Manual Migration

When upgrading LlamaRunner Pro, configuration files may need updating:

```json
{
  "version": "1.0",
  "migrated_from": "0.9.x",
  "migration_notes": "Added audio configuration section"
}
```

## Environment Variables

### Override Configuration

Environment variables can override configuration file settings:

```bash
# Override proxy ports
export LLAMA_RUNNER_OLLAMA_PORT=11435
export LLAMA_RUNNER_LMSTUDIO_PORT=1235

# Override model paths
export LLAMA_RUNNER_MODELS_DIR="/custom/models"

# Override logging
export LLAMA_RUNNER_LOG_LEVEL="DEBUG"

# Enable/disable features
export LLAMA_RUNNER_ENABLE_AUDIO="false"
export LLAMA_RUNNER_HEADLESS="true"
```

### Environment Variable Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LLAMA_RUNNER_CONFIG_DIR` | str | `~/.llama-runner` | Configuration directory |
| `LLAMA_RUNNER_MODELS_DIR` | str | `~/models` | Default models directory |
| `LLAMA_RUNNER_LOG_LEVEL` | str | `INFO` | Logging level |
| `LLAMA_RUNNER_OLLAMA_PORT` | int | 11434 | Ollama proxy port |
| `LLAMA_RUNNER_LMSTUDIO_PORT` | int | 1234 | LM Studio proxy port |
| `LLAMA_RUNNER_ENABLE_AUDIO` | bool | `true` | Enable audio features |
| `LLAMA_RUNNER_HEADLESS` | bool | `false` | Run in headless mode |
| `LLAMA_RUNNER_MAX_MEMORY_MB` | int | 8192 | Maximum memory usage |
| `LLAMA_RUNNER_MAX_MODELS` | int | 3 | Maximum concurrent models |

## Configuration Best Practices

### 1. Organization

- Use descriptive model names
- Group related models with consistent parameters
- Document custom configurations with comments

### 2. Security

- Enable authentication in production
- Use strong API keys or OAuth
- Configure CORS carefully
- Set appropriate rate limits

### 3. Performance

- Adjust `ctx_size` based on model size and available memory
- Use GPU layers for models that fit in VRAM
- Set appropriate thread counts
- Enable lazy loading for production

### 4. Monitoring

- Enable logging and health checks
- Configure monitoring for production
- Set up alerts for resource usage
- Keep configuration backups

### 5. Deployment

- Use environment-specific configurations
- Validate configuration before deployment
- Keep sensitive data in environment variables
- Use configuration templates for multiple deployments

## Troubleshooting Configuration

### Common Issues

1. **Port Already in Use**
   ```json
   {
     "proxies": {
       "ollama": {
         "port": 11435  // Change to unused port
       }
     }
   }
   ```

2. **Model Not Found**
   ```json
   {
     "models": {
       "model-name": {
         "model_path": "/absolute/path/to/model.gguf"
       }
     }
   }
   ```

3. **Memory Issues**
   ```json
   {
     "performance": {
       "memory": {
         "max_model_memory_mb": 4096,
         "model_cache_size": 1
       }
     }
   }
   ```

### Debug Configuration

```json
{
  "debug": {
    "enabled": true,
    "log_level": "DEBUG",
    "show_config_on_startup": true,
    "validate_models_on_load": true
  }
}
```
