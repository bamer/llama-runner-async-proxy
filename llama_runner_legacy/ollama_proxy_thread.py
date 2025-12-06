import asyncio
import logging
import json
from typing import Dict, Any, Callable, Optional, AsyncGenerator, Awaitable # Added Awaitable import

import httpx

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

from llama_runner_legacy.ollama_proxy_conversions import (
    embeddingRequestFromOllama, generateRequestFromOllama, chatRequestFromOllama
)
from llama_runner_legacy.audio_service import AudioService
from llama_runner_legacy.services.runner_service import RunnerService

from io import BytesIO
from fastapi import UploadFile as FastAPIUploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def _dynamic_route_runner_request_generator(request: Request, target_path: str, request_body: Dict[str, Any]) -> AsyncGenerator[bytes, None]:
    get_runner_port_callback = request.app.state.get_runner_port_callback
    request_runner_start_callback = request.app.state.request_runner_start_callback
    model_name_from_request = request_body.get("model")
    if not model_name_from_request:
        yield b'data: {"error": "Model name not specified"}\n\n'
        return

    port = get_runner_port_callback(model_name_from_request)
    if port is None:
        try:
            port = await asyncio.wait_for(request_runner_start_callback(model_name_from_request), timeout=240)
        except asyncio.TimeoutError:
            yield f"data: {{\"error\": \"Timeout starting runner for model '{model_name_from_request}'.\"}}\n\n".encode('utf-8')
            return
        except Exception as e:
            yield f"data: {{\"error\": \"Error starting runner: {e}\"}}\n\n".encode('utf-8')
            return

    target_url = f"http://127.0.0.1:{port}{target_path}"
    async with httpx.AsyncClient() as client:
        try:
            async with client.stream(
                method=request.method,
                url=target_url,
                headers={k: v for k, v in request.headers.items() if k.lower() != 'host'},
                json=request_body,
                timeout=600.0,
            ) as proxy_response:
                async for chunk in proxy_response.aiter_bytes():
                    yield chunk
        except httpx.RequestError as e:
            yield f'data: {{"error": "Error communicating with runner: {e}"}}\n\n'.encode('utf-8')

# All the endpoint handlers remain the same...
@app.post("/api/generate")
async def generate_completion(request: Request):
    ollama_req = await request.json()
    openai_req = generateRequestFromOllama(ollama_req)
    openai_req["stream"] = ollama_req.get("stream", True)
    return StreamingResponse(_dynamic_route_runner_request_generator(request, "/v1/completions", openai_req), media_type="text/event-stream")

@app.post("/api/chat")
async def chat_completion(request: Request):
    ollama_req = await request.json()
    openai_req = chatRequestFromOllama(ollama_req)
    openai_req["stream"] = ollama_req.get("stream", True)
    return StreamingResponse(_dynamic_route_runner_request_generator(request, "/v1/chat/completions", openai_req), media_type="text/event-stream")

@app.post("/api/embeddings")
async def generate_embeddings(request: Request):
    ollama_req = await request.json()
    openai_req = embeddingRequestFromOllama(ollama_req)
    async for chunk in _dynamic_route_runner_request_generator(request, "/v1/embeddings", openai_req):
        return JSONResponse(content=json.loads(chunk.decode('utf-8')))

@app.get("/api/tags")
async def list_models(request: Request):
    all_models_config = request.app.state.all_models_config
    model_list = [{"name": name, **config} for name, config in all_models_config.items()]
    return JSONResponse(content={"models": model_list})

# Simplified show endpoint for brevity in this refactoring
@app.post("/api/show")
async def show_model_info(request: Request):
    req_body = await request.json()
    model_name = req_body.get("model")
    if not model_name or model_name not in request.app.state.all_models_config:
        raise HTTPException(status_code=404, detail="Model not found")
    return JSONResponse(content=request.app.state.all_models_config[model_name])

@app.post("/v1/audio/transcriptions")
async def ollama_speech_to_text(request: Request):
    """Function to convert speech to text using faster-whisper for Ollama proxy"""
    # Retrieve the audio service from app state
    audio_service = request.app.state.audio_service
    return await audio_service.transcribe_audio_request(request)

@app.post("/v1/audio/translations")
async def ollama_speech_to_text_translate(request: Request):
    """Function to convert speech to text using faster-whisper with translation for Ollama proxy"""
    # Retrieve the audio service from app state
    audio_service = request.app.state.audio_service
    return await audio_service.translate_audio_request(request)

class OllamaProxyServer:
    def __init__(self,
                 all_models_config: Dict[str, Any],
                 get_runner_port_callback: Callable[[str], Optional[int]],
                 request_runner_start_callback: Callable[[str], Awaitable[int]], # Updated return type hint
                 llama_runner_manager: Optional['RunnerService'] = None):
        self.all_models_config = all_models_config
        self.get_runner_port_callback = get_runner_port_callback
        self.request_runner_start_callback = request_runner_start_callback
        self.llama_runner_manager = llama_runner_manager
        self._uvicorn_server = None
        self.task = None

    async def start(self):
        app.state.all_models_config = self.all_models_config
        app.state.get_runner_port_callback = self.get_runner_port_callback
        app.state.request_runner_start_callback = self.request_runner_start_callback
        if self.llama_runner_manager:
            # The llama_runner_manager passed here is now a RunnerService instance.
            # AudioService expects the old LlamaRunnerManager interface for getting/starting whisper runners.
            # We need to ensure RunnerService exposes the necessary methods for AudioService.
            # For now, let's assume RunnerService has the required methods.
            app.state.llama_runner_manager = self.llama_runner_manager
            app.state.audio_service = AudioService(self.llama_runner_manager)

        uvicorn_config = uvicorn.Config(app, host="127.0.0.1", port=11434, log_level="info")
        self._uvicorn_server = uvicorn.Server(uvicorn_config)

        logging.info("Ollama Proxy listening on http://127.0.0.1:11434")
        try:
            await self._uvicorn_server.serve()
        except asyncio.CancelledError:
            logging.info("Ollama Proxy server task cancelled.")
        finally:
            logging.info("Ollama Proxy server shut down.")

    def stop(self):
        if self._uvicorn_server:
            self._uvicorn_server.should_exit = True
        if self.task:
            self.task.cancel()
