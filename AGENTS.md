# AGENTS.md

## Development Commands

### Running the Application
```bash
python app/main.py
python run_fastapi_app.py
```

### Testing
```bash
pytest                    # Run all tests
pytest path/to/test.py    # Run single test file
pytest -k test_name       # Run specific test
pytest --cov=app         # Run tests with coverage
pytest -v                # Verbose test output
```

### Build/Lint Commands
```bash
# Linting and formatting
python -m black .        # Format code
python -m flake8 .       # Check for style issues

# Type checking
mypy app/                # Run type checks
```

## Code Style Guidelines

### Imports & Types
- Use absolute imports: `from app.core.config import settings`
- Group imports: standard library, third-party, local application
- Use TypedDict for configuration objects (see `llama_runner/models/config_model.py`)
- Type hints required for function signatures and complex return types
- Use `Optional[T]` for nullable values

### Naming & Patterns
- Classes: PascalCase (`RunnerService`, `ConfigRepository`)
- Functions/variables: snake_case (`request_runner_start`)
- Constants: UPPER_SNAKE_CASE (`LLAMA_SERVER_ABSOLUTE_PATH`)
- Private methods: prefix with underscore (`_wrap_on_started`)
- Use `async def` for I/O operations with `asyncio.Semaphore` for concurrency

### Error Handling & Config
- Use module-level logger: `logger = logging.getLogger(__name__)`
- Load configs via `llama_runner.config_loader` using repository pattern
- Store configuration in JSON files under `config/` directory