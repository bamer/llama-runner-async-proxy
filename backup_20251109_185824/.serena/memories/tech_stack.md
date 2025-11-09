# Tech Stack

## Core Technologies


- **Python 3.12+**: Main programming language
- **FastAPI**: Web framework for API endpoints
- **PySide6**: GUI framework (for non-headless mode)
- **qasync**: Integration between asyncio and Qt event loop
- **llama.cpp**: Backend for LLM inference
- **whisper.cpp**: Backend for audio processing (speech-to-text)
- **ffmpeg**: Audio format conversion (WAV required for whisper.cpp)

## Key Libraries


- `subprocess`: For launching and managing external processes (llama-server, whisper-server)
- `requests`/`httpx`: For HTTP communication with runners
- `logging`: Comprehensive logging system with file and console output
- `json`: Configuration file handling
- `asyncio`: Asynchronous programming model

## Project Structure


- `main.py`: Entry point with argument parsing and application initialization
- `llama_runner/`: Core module directory
  - `config_loader.py`: Configuration management
  - `llama_cpp_runner.py`: LLM runner management
  - `whisper_cpp_runner.py`: Audio runner management
  - `llama_runner_manager.py`: Central runner orchestration
  - `lmstudio_proxy_thread.py`: LM Studio API emulation
  - `ollama_proxy_thread.py`: Ollama API emulation
  - `headless_service_manager.py`: Headless mode service management
  - `main_window.py`: GUI mode management
