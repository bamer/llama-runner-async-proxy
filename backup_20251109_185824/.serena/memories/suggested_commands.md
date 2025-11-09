# Suggested Commands

## Development Setup

```bash

# Clone the repository

git clone https://github.com/bamer/llama-runner
cd llama-runner

# Create and activate virtual environment (Windows)

mkdir dev-venv
python -m venv dev-venv
dev-venv\\Scripts\\Activate.ps1

# Install dependencies

pip install -r requirements.txt
```

## Configuration

```bash

# Create default configuration directory and file

# The application will create ~/.llama-runner/config.json on first run

# You need to edit this file to add your models and runtimes

```

## Running the Application

```bash

# Run with GUI (default)

python main.py

# Run in headless mode

python main.py --headless

# Set log level

python main.py --log-level DEBUG
python main.py --log-level INFO
python main.py --log-level WARNING
```

## Testing Audio Functionality

```bash

# Test transcription endpoint (LM Studio proxy on port 1234)

curl -X POST http://localhost:1234/v1/audio/transcriptions \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.wav" \
  -F "model=whisper-tiny"

# Test translation endpoint (LM Studio proxy on port 1234)

curl -X POST http://localhost:1234/v1/audio/translations \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.wav" \
  -F "model=whisper-tiny"

# Test transcription endpoint (Ollama proxy on port 11434)

curl -X POST http://localhost:11434/v1/audio/transcriptions \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio.wav" \
  -F "model=whisper-tiny"
```

## System Commands (Windows)


- `dir`: List directory contents
- `cd`: Change directory
- `type`: Display file contents
- `git status`: Check git status
- `git diff`: Show changes
- `python -m pip list`: List installed packages
