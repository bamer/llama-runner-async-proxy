# Proxy Launch Procedure for Development Environment

## Working Directory


- Always work in: `F:\llm\llama-runner-async-proxy`
- Never access other directories without explicit permission

## Environment Setup

1. Set environment variables:
   ```cmd
   set PYTHONIOENCODING=utf-8
   set CUDA_VISIBLE_DEVICES=0
   set LLAMA_SET_ROWS=1
   ```

2. Activate virtual environment:
   ```cmd
   .\dev-venv\Scripts\Activate.ps1
   ```

3. Launch proxy in headless mode:
   ```cmd
   python main.py --headless
   ```

## Testing Procedure


- Always test in the development directory (`F:\llm\llama-runner-async-proxy`)
- Ensure all dependencies are installed in the virtual environment
- Verify proxy launches and handles requests correctly
- Test both LM Studio (port 1234) and Ollama (port 11434) endpoints
- Test audio endpoints: `/v1/audio/transcriptions` and `/v1/audio/translations`
