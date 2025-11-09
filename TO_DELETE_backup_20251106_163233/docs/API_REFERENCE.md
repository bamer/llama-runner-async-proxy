# 🔌 API Reference - LlamaRunner Pro

## Overview

LlamaRunner Pro provides OpenAI-compatible API endpoints through two proxy servers. Both proxies expose the same interface but target different backend services.

## Base URLs

- **Ollama Proxy**: `http://localhost:11434`
- **LM Studio Proxy**: `http://localhost:1234`

Both proxies implement the OpenAI API specification with some extensions for model management.

## Authentication

Currently, no authentication is required for local usage. For production deployments:

```bash
# Include API key in requests
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:1234/v1/models
```

## Core Endpoints

### Models Management

#### List Models

```http
GET /v1/models
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "qwen2.5-7b-instruct",
      "object": "model",
      "created": 1677610602,
      "owned_by": "llama-runner"
    }
  ]
}
```

#### Model Status

```http
GET /v1/models/{model_id}/status
```

**Response:**
```json
{
  "id": "qwen2.5-7b-instruct",
  "status": "loaded", // loaded, loading, unloaded, error
  "port": 8080,
  "uptime": 3600,
  "memory_usage": 4294967296,
  "last_used": "2025-01-06T10:30:00Z"
}
```

### Chat Completions

#### Standard Chat

```http
POST /v1/chat/completions
```

**Request Body:**
```json
{
  "model": "qwen2.5-7b-instruct",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "qwen2.5-7b-instruct",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 12,
    "total_tokens": 27
  }
}
```

#### Streaming Chat

```http
POST /v1/chat/completions
Content-Type: text/event-stream
```

**Request Body:**
```json
{
  "model": "qwen2.5-7b-instruct",
  "messages": [
    {
      "role": "user",
      "content": "Tell me a story about AI."
    }
  ],
  "stream": true,
  "temperature": 0.8
}
```

**Response (Server-Sent Events):**
```json
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1677652288,"model":"qwen2.5-7b-instruct","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1677652288,"model":"qwen2.5-7b-instruct","choices":[{"index":0,"delta":{"content":" upon a time"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1677652288,"model":"qwen2.5-7b-instruct","choices":[{"index":0,"delta":{"content":".","finish_reason":"stop"}]}

data: [DONE]
```

### Completions (Legacy)

```http
POST /v1/completions
```

**Request Body:**
```json
{
  "model": "qwen2.5-7b-instruct",
  "prompt": "Once upon a time",
  "max_tokens": 100,
  "temperature": 0.7
}
```

### Embeddings

```http
POST /v1/embeddings
```

**Request Body:**
```json
{
  "model": "text-embedding-model",
  "input": ["Hello world", "This is a test"]
}
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.1, 0.2, 0.3, ...],
      "index": 0
    }
  ],
  "model": "text-embedding-model"
}
```

## Audio Endpoints (faster-whisper Integration)

### Audio Transcription

```http
POST /v1/audio/transcriptions
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Audio file (wav, mp3, m4a, ogg)
- `model`: whisper model (tiny, base, small, medium, large)
- `language`: ISO language code (optional, auto-detect if not provided)
- `response_format`: json or text (default: json)

**Example:**
```bash
curl -X POST http://localhost:1234/v1/audio/transcriptions \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.mp3" \
  -F "model=whisper-base" \
  -F "language=en"
```

**Response:**
```json
{
  "text": "Hello, this is a test of the transcription service.",
  "language": "en",
  "duration": 5.2,
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Hello, this is a test"
    },
    {
      "start": 2.5,
      "end": 5.2,
      "text": "of the transcription service."
    }
  ]
}
```

### Audio Translation

```http
POST /v1/audio/translations
Content-Type: multipart/form-data
```

Translates audio to English text (faster-whisper specific feature).

**Response:**
```json
{
  "text": "Hello, this is a test of the translation service.",
  "language": "en",
  "duration": 5.2
}
```

## Model Management Endpoints

### Start Model

```http
POST /v1/models/{model_id}/start
```

**Response:**
```json
{
  "success": true,
  "port": 8080,
  "status": "starting"
}
```

### Stop Model

```http
POST /v1/models/{model_id}/stop
```

**Response:**
```json
{
  "success": true,
  "status": "stopped"
}
```

### Model Information

```http
GET /v1/models/{model_id}/info
```

**Response:**
```json
{
  "id": "qwen2.5-7b-instruct",
  "path": "/models/qwen2.5-7b-instruct-q4_k_m.gguf",
  "size": 4294967296,
  "parameters": 7000000000,
  "format": "GGUF",
  "architecture": "qwen2",
  "context_length": 32768,
  "loaded": true,
  "port": 8080
}
```

## System Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-06T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

### System Status

```http
GET /v1/system/status
```

**Response:**
```json
{
  "status": "running",
  "models": {
    "total": 5,
    "loaded": 2,
    "memory_usage": 8589934592
  },
  "proxies": {
    "ollama": {"status": "running", "port": 11434},
    "lmstudio": {"status": "running", "port": 1234}
  },
  "system": {
    "cpu_usage": 45.2,
    "memory_usage": 16384,
    "available_memory": 32768
  }
}
```

### Server Info

```http
GET /v1/server/info
```

**Response:**
```json
{
  "id": "llama-runner-pro",
  "version": "1.0.0",
  "description": "LlamaRunner Pro - AI Proxy Suite",
  "features": ["chat", "completions", "embeddings", "audio", "streaming"],
  "models_supported": ["gguf", "safetensors"],
  "runtime_info": {
    "python_version": "3.11.0",
    "platform": "Windows-10-10.0.19045"
  }
}
```

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "model_not_found",
    "message": "The model 'invalid-model' was not found.",
    "type": "invalid_request_error"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `model_not_found` | 404 | Model ID not found |
| `model_not_loaded` | 400 | Model exists but not loaded |
| `invalid_request` | 400 | Malformed request |
| `rate_limit_exceeded` | 429 | Too many requests |
| `server_error` | 500 | Internal server error |
| `service_unavailable` | 503 | Service temporarily unavailable |

### Rate Limiting

Rate limits are applied per client IP address:

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "type": "rate_limit_error"
  }
}
```

## WebSocket Support

For real-time communication:

```javascript
const ws = new WebSocket('ws://localhost:1234/v1/ws');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send message
ws.send(JSON.stringify({
  type: 'chat_message',
  model: 'qwen2.5-7b-instruct',
  message: 'Hello!'
}));
```

## Configuration Examples

### cURL Examples

#### Basic Chat
```bash
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-7b-instruct",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

#### With Streaming
```bash
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-7b-instruct",
    "messages": [
      {"role": "user", "content": "Count to 10"}
    ],
    "stream": true
  }'
```

#### Audio Transcription
```bash
curl -X POST http://localhost:1234/v1/audio/transcriptions \
  -F "file=@sample.wav" \
  -F "model=whisper-base"
```

### Python Client Example

```python
import requests
import json

# Chat completion
response = requests.post('http://localhost:1234/v1/chat/completions', json={
    'model': 'qwen2.5-7b-instruct',
    'messages': [
        {'role': 'user', 'content': 'Hello!'}
    ]
})

result = response.json()
print(result['choices'][0]['message']['content'])

# Audio transcription
with open('audio.mp3', 'rb') as f:
    files = {'file': f}
    data = {'model': 'whisper-base'}
    response = requests.post(
        'http://localhost:1234/v1/audio/transcriptions',
        files=files,
        data=data
    )
    result = response.json()
    print(result['text'])
```

### JavaScript Client Example

```javascript
class LlamaRunnerClient {
  constructor(baseUrl = 'http://localhost:1234') {
    this.baseUrl = baseUrl;
  }

  async chat(model, messages, options = {}) {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        ...options
      })
    });
    
    return await response.json();
  }

  async transcribeAudio(file, model = 'whisper-base') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);
    
    const response = await fetch(`${this.baseUrl}/v1/audio/transcriptions`, {
      method: 'POST',
      body: formData
    });
    
    return await response.json();
  }

  async getModels() {
    const response = await fetch(`${this.baseUrl}/v1/models`);
    return await response.json();
  }
}

// Usage
const client = new LlamaRunnerClient();

// Chat
const chatResult = await client.chat('qwen2.5-7b-instruct', [
  { role: 'user', content: 'Hello!' }
]);

// Audio transcription
const audioFile = document.getElementById('audio-input').files[0];
const transcription = await client.transcribeAudio(audioFile);
```

## SDK Integration

### OpenAI SDK Compatibility

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="sk-dummy"  # Not used but required
)

# Chat completion
completion = client.chat.completions.create(
    model="qwen2.5-7b-instruct",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(completion.choices[0].message.content)
```

### LangChain Integration

```python
from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun
from typing import Optional, List, Any
import requests

class LlamaRunnerLLM(LLM):
    base_url: str = "http://localhost:1234/v1"
    model: str = "qwen2.5-7b-instruct"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
    ) -> str:
        response = requests.post(
            f"{self.base_url}/v1/chat/completions",
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "stop": stop
            }
        )
        return response.json()['choices'][0]['message']['content']
    
    @property
    def _identifying_params(self) -> dict:
        return {"model": self.model}
    
    @property
    def _llm_type(self) -> str:
        return "llama-runner"

# Usage
llm = LlamaRunnerLLM()
result = llm("Tell me a joke")
```

## Rate Limits and Quotas

### Default Limits
- **Requests per minute**: 100
- **Concurrent requests**: 10
- **Streaming connections**: 5
- **File upload size**: 100MB

### Custom Limits
Configure in `config.json`:

```json
{
  "proxies": {
    "lmstudio": {
      "enabled": true,
      "rate_limits": {
        "requests_per_minute": 200,
        "concurrent_requests": 20,
        "file_upload_size_mb": 200
      }
    }
  }
}
```

## Webhook Support

For async operations and notifications:

```http
POST /v1/webhooks/register
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["model.started", "model.stopped", "transcription.completed"]
}
```

**Webhook Payload Example:**
```json
{
  "event": "model.started",
  "timestamp": "2025-01-06T10:30:00Z",
  "data": {
    "model_id": "qwen2.5-7b-instruct",
    "port": 8080
  }
}
```
