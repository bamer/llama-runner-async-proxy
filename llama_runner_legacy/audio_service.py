import logging
import json
import traceback
from typing import Any
from io import BytesIO


from fastapi import Request, UploadFile
from fastapi.responses import JSONResponse




from llama_runner_legacy.error_handlers import handle_audio_processing_error


logger = logging.getLogger(__name__)


class AudioService:
    """
    Centralized service for handling audio processing operations.
    This service encapsulates all audio-related logic including file handling,
    runner management, and transcription/translation operations.
    """
    
    def __init__(self, llama_runner_manager: Any):
        """
        Initialize the audio service with a reference to the runner manager.
        
        :param llama_runner_manager: Instance of LlamaRunnerManager that manages audio runners
        """
        self.llama_runner_manager = llama_runner_manager

    async def transcribe_audio_request(self, request: Request) -> JSONResponse:
        """
        Handle audio transcription requests for both LM Studio and Ollama proxies.
        
        :param request: FastAPI request object containing form data
        :return: JSONResponse with transcription result
        """
        try:
            # Parse form data from the incoming request
            form = await request.form()
            
            # Extract uploaded audio file from form with type checking
            file = form.get("file")
            if not isinstance(file, UploadFile):
                raise ValueError("Invalid file format. Expected UploadFile object")
            
            # Read the content of the uploaded file into bytes
            contents = await file.read()
            
            # Create a FastAPI UploadFile object from bytes content
            fastapi_file = UploadFile(
                filename=file.filename,
                file=BytesIO(contents)
            )
            
            # Extract model name from the form data
            model = str(form.get("model", ""))
            if not model:
                raise ValueError("Model parameter is required")

            # Get or create the faster-whisper runner for this model
            if not self.llama_runner_manager.is_whisper_runner_running(model):
                # Start the faster-whisper runner
                await self.llama_runner_manager.request_runner_start(model, True)
            
            # Get the faster-whisper runner
            faster_whisper_runner = self.llama_runner_manager.get_faster_whisper_runner(model)
            if faster_whisper_runner is None:
                raise RuntimeError("Failed to initialize faster-whisper runner")
            
            # Convert the uploaded audio file to WAV format
            audio_file_path = faster_whisper_runner.convert_to_wav(fastapi_file)
            # Perform transcription on the WAV audio file
            result = faster_whisper_runner.transcribe_audio(audio_file_path, task="transcribe")
            # Return transcription result as JSON response
            if result is None:
                raise RuntimeError("Transcription failed")
            return JSONResponse(content={"text": result["text"]})
        
        except (json.JSONDecodeError, ValueError, RuntimeError) as e:
            handle_audio_processing_error(e, "audio transcription")
            raise  # This line will never be reached, but satisfies type checker
        except Exception as e:
            # Log unexpected errors and delegate to centralized handler
            logger.error(f"Unexpected error handling audio transcription: {e}\n{traceback.format_exc()}")
            handle_audio_processing_error(e, "audio transcription")
            raise  # This line will never be reached, but satisfies type checker

    async def translate_audio_request(self, request: Request) -> JSONResponse:
        """
        Handle audio translation requests for both LM Studio and Ollama proxies.
        
        :param request: FastAPI request object containing form data
        :return: JSONResponse with translation result
        """
        try:
            # Parse form data from the incoming request
            form = await request.form()
            
            # Extract uploaded audio file from form
            file = form.get("file")
            if not isinstance(file, UploadFile):
                raise ValueError("Invalid file format. Expected UploadFile object")
            
            # Read the content of the uploaded file into bytes
            contents = await file.read()
            
            # Create a FastAPI UploadFile object from bytes content, preserving filename
            fastapi_file = UploadFile(filename=file.filename, file=BytesIO(contents))
            
            # Extract model name from the form data
            model = str(form.get("model", ""))
            if not model:
                raise ValueError("Model parameter is required")

            # Get or create the faster-whisper runner for this model
            if not self.llama_runner_manager.is_whisper_runner_running(model):
                # Start the faster-whisper runner
                await self.llama_runner_manager.request_runner_start(model, True)
            
            # Get the faster-whisper runner
            faster_whisper_runner = self.llama_runner_manager.get_faster_whisper_runner(model)
            if faster_whisper_runner is None:
                raise RuntimeError("Failed to initialize faster-whisper runner")
            
            # Convert the uploaded audio file to WAV format
            audio_file_path = faster_whisper_runner.convert_to_wav(fastapi_file)
            # Perform translation on the WAV audio file
            result = faster_whisper_runner.transcribe_audio(audio_file_path, task="translate")
            # Return translation result as JSON response
            if result is None:
                raise RuntimeError("Translation failed")
            return JSONResponse(content={"text": result["text"]})
        
        except (json.JSONDecodeError, ValueError, RuntimeError) as e:
            handle_audio_processing_error(e, "audio translation")
        except Exception as e:
            # Log unexpected errors and delegate to centralized handler
            logger.error(f"Unexpected error handling audio translation: {e}\\n{traceback.format_exc()}")
            handle_audio_processing_error(e, "audio translation")
