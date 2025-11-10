# 🧭 Technical & Structural Overview — *LlamaRunner Pro / Async Proxy System*

> **Purpose:** A complete guide for new developers joining the project, explaining the technical framework, file organization, and coding standards. Updated to reflect the latest project configuration and environment.

---

## ⚙️ 1. Project Overview

**Project Name:** `LlamaRunner Pro – Async Proxy System`  
**Goal:** Provide a unified interface between various AI models (LM Studio, Ollama, etc.) through an **asynchronous Python proxy**, paired with a **Vue.js web dashboard** and real-time monitoring tools.

The system runs on **Windows and Linux** platforms, designed for **autonomous, modular, and extensible** operation.

---

## 🧩 2. Technology Stack

### 🖥 Backend
| Component | Technology | Role |
|------------|-------------|------|
| **Language** | Python 3.11+ | Proxy, orchestration, monitoring |
| **Web Framework** | FastAPI / uvicorn | API and asynchronous request handling |
| **Realtime Layer** | WebSocket | Live communication |
| **GUI Framework** | PySide6 | Optional desktop interface |
| **System Monitoring** | psutil | CPU, memory, and GPU metrics collection |
| **Packaging / Build** | PyInstaller | Executable generation |

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
├── LaunchMenu.ps1               # Main interactive menu must stay there and only script
├── main.py                      # Python entry point
├── config/                      # Configuration files
│   ├── app_config.json          # General aplication configuration
│   ├── models_config.json       # list of models and Model-specific settings
├── logs/                        # Rotating logs all log related files must go there
├── scripts/                     # PowerShell tools
│   ├── model_management.ps1     # Model (.gguf) management
│   ├── Validate-System.ps1      # System validation
│   ├── PortConfig.ps1           # Network configuration
│   └── Debug-Launch.ps1         # Debug launch mode
├── tests/                       # Unit & integration tests
│   ├── test_implementation_validation.py
│   ├── unit/
│   │   ├── test_config_updater.py
│   │   ├── test_llama_runner_manager.py
│   │   └── test_metrics_validation.py
├── docs/                        # Documentation (formerly documentation/)
│   ├── README.md
│   ├── INSTALLATION.md
│   └── USAGE.md
├── dashboard/                   # Vue.js + Chart.js frontend
├── tests/                       # All tests related files must be there
└── llama_runner/                # Core Python backend
```

the llama-server path is "F:\llm\llama\llama-server.exe" and must never change
The directory containing all llm models is "F:\llm\llama\models" each model are in a subdirectory Ex:
model name : JanusCoderV-7B.i1-Q4_K_S.gguf is in directory : 
"F:\llm\llama\models\JanusCoderV-7B-i1-GGUF\JanusCoderV-7B.i1-Q4_K_S.gguf"
other exemple :
neutss-air-BF16.gguf
"F:\llm\llama\models\neutts-air\neutss-air-BF16.gguf"
---

## 🧠 4. Code Structure & Modules

### `llama_runner/` (Backend Core)
- **`main.py`** — main FastAPI server entry point.
- **`proxy_manager.py`** — coordinates LM Studio, Ollama, and other local models.
- **`config_loader.py`** — reads and validates configuration files from `/config`.
- **`metrics_collector.py`** — collects system metrics via psutil.
- **`websocket_manager.py`** — sends live data to the dashboard.
- **`runner_manager.py`** — handles subprocesses and inter-process communication.

---

## 🧾 5. Coding Standards (from `code_conventions.md`)

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
- separation of concerns is a priority and mandatory way of 
---


## 🔐 6. Security & Configuration

- Sensitive files have restricted permissions.
- **Standard ports:**
  | Service | Port |
  |----------|------|
  | LM Studio API | 1234 |
  | Ollama API | 11434 |
  | Dashboard Web | 8035 |

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


---

### ✅ End of Document

