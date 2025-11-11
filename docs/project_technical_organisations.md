# 🧭 Technical & Structural Overview — *LlamaRunner Pro / Async Proxy System*

> **Purpose:** A complete guide for new developers joining the project, explaining the technical framework, file organization, and coding standards. Updated to reflect the latest project configuration and environment.

---

## ⚙️ 1. Project Overview

**Project Name:** `LlamaRunner Pro – Async Proxy System`  
**Goal:** Provide a unified interface between various AI models (LM Studio, Ollama, etc.) through an **asynchronous Python proxy**, paired with a **Vue.js web dashboard** for management and configuration.

The system runs on **Windows and Linux** platforms, designed for **autonomous, modular, and extensible** operation.

---

## 🧩 2. Technology Stack

### 🖥 Backend
| Component | Technology | Role |
|------------|-------------|------|
| **Language** | Python 3.11+ | Proxy, orchestration |
| **Web Framework** | FastAPI / uvicorn | API and asynchronous request handling |
| **System Monitoring** | psutil | CPU, memory, and GPU metrics collection |

### 🌐 Frontend / Dashboard
| Component | Technology | Role |
|------------|-------------|------|
| **Framework** | Vue.js 3 | Web dashboard |
| **UI Library** | Element Plus | UI components |
| **Charts** | Chart.js | Real-time monitoring visualization |
| **Build Tool** | Vite | Compilation and bundling |
| **Styles** | SCSS | Advanced styling |

### 🧱 Development Tools
- **PowerShell 7+** for the launch menu (`LaunchMenu.ps1`)
- **VS Code** as the primary IDE  
- **pytest** and **unittest** for testing  
- **Git** for version control  
- **Linters / Formatters:** black, flake8, eslint  
- **Environments:** Virtualenv (`venv`) or **Anaconda** (no Docker)

---

## 🗂 3. Project File Structure

```
llama-runner-async-proxy/
├── LaunchMenu.ps1               # Main simplified launch menu
├── main.py                      # Python entry point
├── ARCHITECTURE.md              # Architecture documentation
├── config/                      # Configuration files
│   ├── app_config.json          # General application configuration
│   ├── models_config.json       # List of models and Model-specific settings
├── logs/                        # Log files
├── scripts/                     # PowerShell tools
│   ├── validate_system.ps1      # System validation
├── docs/                        # Documentation
│   ├── README.md
│   ├── INSTALLATION.md
│   └── ARCHITECTURE.md          # Current architecture
├── dashboard/                   # Vue.js frontend
├── tests/                       # Unit & integration tests
└── llama_runner/                # Core Python backend
    ├── config_loader.py
    ├── headless_service_manager.py
    ├── llama_cpp_runner.py
    ├── ollama_proxy_thread.py
    ├── lmstudio_proxy_thread.py
    ├── model_discovery.py
    ├── services/
    │   ├── config_validator.py
    │   ├── config_updater.py
    │   └── metrics_collector.py
    └── repositories/
```

The llama-server path is "F:\\llm\\llama\\llama-server.exe" and must never change.
The directory containing all llm models is "F:\\llm\\llama\\models". Each model is in a subdirectory. Example:
Model name: JanusCoderV-7B.i1-Q4_K_S.gguf is in directory: 
"F:\\llm\\llama\\models\\JanusCoderV-7B-i1-GGUF\\JanusCoderV-7B.i1-Q4_K_S.gguf"

---

## 🧠 4. Code Structure & Modules

### `llama_runner/` (Backend Core)
- **`main.py`** — main application entry point.
- **`headless_service_manager.py`** — manages services, proxies, and model runners.
- **`config_loader.py`** — reads and validates configuration files from `/config`.
- **`metrics_collector.py`** — collects system metrics via psutil.
- **`ollama_proxy_thread.py`** — Ollama-compatible API proxy.
- **`lmstudio_proxy_thread.py`** — LM Studio-compatible API proxy.
- **`model_discovery.py`** — discovers and manages model configurations.

---

## 🧾 5. Coding Standards

### Style & Typing
- All functions must include **type hints**.
- Strict **snake_case / PascalCase** naming conventions.
- Enforce **UTF-8** encoding across I/O, logs, and configs.
- Log both to **console and file**.
- Non-critical issues → `warning`, critical issues → `exception`.

### Structure
- One class or concept per Python file.
- Loaders, runners, and proxies are logically separated.
- Centralized validation via `config_loader.py`.
- Separation of concerns is a priority and mandatory way of development.

---

## 🔐 6. Security & Configuration

- Sensitive files have restricted permissions.
- **Standard ports:**
  | Service | Port |
  |----------|------|
  | LM Studio API | 1234 |
  | Ollama API | 11434 |
  | Dashboard Web | 8080 |
  | llama-server (direct) | 8035 |

- Deployment is local only, with **venv or Anaconda**, no Docker.

---

## 🧭 7. Key Principles for Contributors

1. **Never delete files without prior analysis.**  
2. **Use atomic, meaningful commits.**  
3. **Never ignore high-severity diagnostics.**  
4. **Document every functional change.**  
5. **Follow type safety and conventions 100%.**  
6. **Run all tests locally before committing.**

---

### ✅ End of Document
