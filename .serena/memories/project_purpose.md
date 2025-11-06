# Project Purpose

llama-runner is a Llama.cpp runner/swapper and proxy that emulates LMStudio / Ollama backends for IntelliJ AI Assistant and GitHub Copilot. It now includes support for audio processing via Whisper.cpp.

Key features:

- Headless mode support with `--headless` flag
- Dynamic loading/unloading of LLM runtimes based on model requests
- Double proxy: emulation for both LM Studio (port 1234) and Ollama (port 11434) backends
- Audio processing support with Whisper.cpp for speech-to-text transcription and translation
- Tested on Windows and Linux (Ubuntu 24.10)
- UTF-8 encoding handling for Unicode characters in logs and outputs
