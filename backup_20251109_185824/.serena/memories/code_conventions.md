# Code Conventions

## Style Guidelines


- **Type hints**: Extensive use of type hints for all function parameters and return types
- **Error handling**: Non-critical errors should log warnings rather than crash the application
- **UTF-8 encoding**: Explicit handling of UTF-8 encoding for stdout/stderr to support Unicode characters
- **Logging**: Comprehensive logging with both console and file output
- **Configuration validation**: Robust validation of configuration files with graceful degradation

## Error Handling Philosophy


- The application should be resilient to minor configuration errors
- Missing or invalid configuration entries should generate warnings but not prevent startup
- Critical errors should be logged with full stack traces for debugging
- User-facing errors should provide clear, actionable error messages

## Naming Conventions


- **Classes**: PascalCase (e.g., `WhisperServer`, `LMStudioProxyServer`)
- **Functions/Methods**: snake_case (e.g., `load_config`, `start_server`)
- **Variables**: snake_case (e.g., `audio_config`, `model_path`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `CONFIG_DIR`, `CONFIG_FILE`)

## File Structure


- Each major component has its own Python file
- Related functionality is grouped in the same module
- Configuration loading is centralized in `config_loader.py`
- Runner management is separated from proxy logic
