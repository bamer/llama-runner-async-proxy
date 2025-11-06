# Refactoring Plan

## Current State


- The project has a functional proxy setup for LMStudio and Ollama
- Audio functionality is implemented
- Configuration loading is in place
- The code is structured around a `LlamaRunnerManager` and proxy servers
- There are separate files for different components

## Goal


- Improve code quality by applying clean architecture principles
- Ensure strict typing
- Add comprehensive documentation
- Separate concerns clearly
- Implement centralized error handling
- Make the codebase maintainable and clean

## Steps

1.  **Analyze Current Structure:**

    -   Identify core components: `LlamaRunnerManager`, `LMStudioProxyServer`, `OllamaProxyServer`, `AudioService`, `FasterWhisperRunner`, `LlamaCppRunner`, `ConfigLoader`, `HeadlessServiceManager`, `ErrorHandlers`.
    -   Understand dependencies and data flow.
    -   Note the presence of `models`, `repositories`, `services`, `controllers` directories which suggest a layered architecture is intended but not fully implemented.

2.  **Define Layered Architecture:**

    -   **Models:** Define data structures (e.g., `ModelConfig`).
    -   **Repositories:** Handle data access (e.g., `ConfigRepository`).
    -   **Services:** Contain core business logic (e.g., `RunnerService` - this needs to be created based on `LlamaRunnerManager` logic).
    -   **Controllers:** Handle API requests (e.g., the proxy endpoints in `lmstudio_proxy_thread.py` and `ollama_proxy_thread.py` could be refactored into controllers, but they are also servers, so this might be a hybrid role or require a different name like `APIHandlers`).
    -   **Infrastructure:** Handle external concerns like CLI, file I/O, etc. (e.g., `main.py`, `config_loader.py`).

3.  **Refactor Components:**

    -   **`LlamaRunnerManager`:**
        -   This seems to be the core business logic for managing runners. Extract this logic into a `RunnerService`.
        -   Ensure it uses the `ConfigRepository` for config access.
        -   Ensure it uses the `ModelConfig` for type safety.
        -   Apply dependency injection for the config repository.
    -   **`HeadlessServiceManager`:**
        -   This orchestrates the startup of proxies and the runner manager.
        -   It should depend on the `RunnerService` (formerly `LlamaRunnerManager`) and the proxy servers.
        -   Consider if this belongs in Infrastructure or as a high-level Service depending on how complex orchestration becomes.
    -   **Proxy Servers (`LMStudioProxyServer`, `OllamaProxyServer`):**
        -   These are FastAPI apps that handle API requests.
        -   The logic inside their handlers should delegate to the `RunnerService`.
        -   The `AudioService` is already separate, which is good.
        -   The `app.state` assignments for callbacks should point to methods on the `RunnerService`.
    -   **`AudioService`:**
        -   This is already well-separated.
        -   Ensure it interacts with the `RunnerService` if needed (e.g., for starting whisper runners).
        -   Ensure it uses the `ConfigRepository` for audio config.
    -   **`FasterWhisperRunner`, `LlamaCppRunner`:**
        -   These are specific implementations for running models.
        -   They might be part of the Infrastructure layer or a sub-service if runner management is abstracted.
        -   Ensure they are injected with necessary config.
    -   **`ConfigLoader`:**
        -   Refactor into `ConfigRepository`.
    -   **`ErrorHandlers`:**
        -   Ensure all error handling uses this centralized module.

4.  **Apply Dependency Injection:**

    -   Use a simple DI mechanism or pass dependencies explicitly in constructors.
    -   `RunnerService` needs `ConfigRepository`.
    -   Proxy servers need `RunnerService`.
    -   `HeadlessServiceManager` needs `RunnerService`.

5.  **Add/Update Type Hints:**

    -   Ensure all functions, methods, and variables have type hints.
    -   Use `typing` module extensively.
    -   Define dataclasses or TypedDicts for configuration structures.

6.  **Add Documentation:**

    -   Add docstrings to all classes and methods.
    -   Use a consistent docstring style (e.g., Google, NumPy, or Sphinx).
    -   Add comments for complex logic.

7.  **Testing:**

    -   Ensure the refactored code still launches and functions correctly.
    -   Add unit tests for the new service layer if possible.

## Implementation Order

1.  Define `ModelConfig` and `ConfigRepository`.
2.  Refactor `LlamaRunnerManager` into `RunnerService`, injecting `ConfigRepository`.
3.  Update `AudioService` to use `ConfigRepository` and interact with `RunnerService` if needed.
4.  Update `HeadlessServiceManager` to use `RunnerService`.
5.  Update Proxy servers (`LMStudioProxyServer`, `OllamaProxyServer`) to use `RunnerService` methods via callbacks.
6.  Ensure `FasterWhisperRunner`, `LlamaCppRunner` are properly configured via injected config.
7.  Verify error handling uses `error_handlers.py`.
8.  Test the application.

This plan aims to clarify responsibilities, improve testability, and make the codebase easier to understand and modify.
