import logging
from typing import NoReturn
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def handle_audio_processing_error(e: Exception, operation: str = "audio processing") -> NoReturn:
    """
    Centralized error handling for audio processing operations.
    
    :param e: The exception that occurred
    :param operation: Description of the operation that failed
    :raises HTTPException: Appropriate HTTP exception based on error type
    """
    error_msg = str(e)
    
    # Handle specific error types
    if "Invalid file format" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Expected UploadFile object"
        )
    elif "Model parameter is required" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Model parameter is required"
        )
    elif "Failed to initialize faster-whisper runner" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize faster-whisper runner"
        )
    elif "Transcription failed" in error_msg or "Translation failed" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audio processing failed"
        )
    elif "Invalid JSON request body" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON request body"
        )
    else:
        # Log unexpected errors and return generic 500 error
        logger.error(f"Unexpected error in {operation}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal Server Error processing audio request"
        )


def handle_runner_startup_error(e: Exception, model_name: str) -> NoReturn:
    """
    Centralized error handling for runner startup failures.
    
    :param e: The exception that occurred
    :param model_name: Name of the model that failed to start
    :raises HTTPException: Appropriate HTTP exception based on error type
    """
    error_msg = str(e)
    
    if "Timeout starting runner" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Timeout starting runner for model '{model_name}'."
        )
    elif "Error starting runner" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error starting runner for model '{model_name}': {error_msg}"
        )
    elif "Runtime not configured" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Runtime not configured for model '{model_name}'."
        )
    elif "Model ID" in error_msg and "not found" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_msg
        )
    else:
        logger.error(f"Unexpected runner startup error for {model_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error starting runner for model '{model_name}': {error_msg}"
        )


def handle_runner_communication_error(e: Exception, model_name: str) -> NoReturn:
    """
    Centralized error handling for runner communication failures.
    
    :param e: The exception that occurred
    :param model_name: Name of the model that had communication issues
    :raises HTTPException: Appropriate HTTP exception based on error type
    """
    error_msg = str(e)
    
    if "Error communicating with runner" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Error communicating with runner for model '{model_name}'."
        )
    elif "Timeout processing request" in error_msg:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Timeout processing request for model '{model_name}'."
        )
    else:
        logger.error(f"Unexpected runner communication error for {model_name}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error communicating with runner for model '{model_name}': {error_msg}"
        )