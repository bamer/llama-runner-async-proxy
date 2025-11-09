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
├── LaunchMenu.ps1               # Main interactive menu
├── main.py                      # Python entry point
├── config/                      # Configuration files
│   ├── config.json              # General configuration
│   ├── models.json              # Model-specific settings
│   ├── ports.json               # Network and API port mapping
├── logs/                        # Rotating logs
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
└── llama_runner/                # Core Python backend
```

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

---

## 🔄 6. Development Workflow

### Main Steps:
1. **Setup:**
   - Clone the repo and run `LaunchMenu.ps1`.
   - Verify Python 3.11+, PowerShell 7+, and environment.

2. **Environment:**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
   or with **Anaconda**:
   ```powershell
   conda create -n llama python=3.11
   conda activate llama
   ```

3. **Run:**
   ```powershell
   .\LaunchMenu.ps1
   ```
   → Choose “🚀 Proxy Mode” or “🧪 System Tests”

4. **Testing:**
   ```powershell
   pytest tests/
   ```

---

## 🧰 7. Recommended Toolchain for Developers

| Type | Tool | Description |
|------|------|-------------|
| IDE | VS Code | With Python, Vue, and Git extensions |
| Environment | venv / Anaconda | Local development only |
| Debugging | PowerShell + Python Debugger | Launch scripts support both |
| Format / Lint | black, flake8, eslint | Maintain clean code |
| Git | Conventional Commits | Clear version history |

---

## 🔐 8. Security & Configuration

- Sensitive files have restricted permissions.
- **Standard ports:**
  | Service | Port |
  |----------|------|
  | LM Studio API | 1234 |
  | Ollama API | 11434 |
  | Dashboard Web | 8035 |

- Deployment is local only, with **venv or Anaconda**, no Docker.

---

## 🧭 9. Key Principles for Contributors

1. **Never delete files without prior analysis.**  
2. **Use atomic, meaningful commits.**  
3. **Never ignore high-severity diagnostics.**  
4. **Document every functional change.**  
5. **Follow type safety and conventions 100%.**  
6. **Run all tests locally before committing.**

---

## 🧩 10. Onboarding Steps for a New Developer

1. Read `README.md` and `INSTALLATION.md` in `/docs`.  
2. Launch the project using `LaunchMenu.ps1`.  
3. Open the folder in VS Code and explore `llama_runner/`.  
4. Review `config_loader.py` for configuration logic.  
5. Run the test suite to confirm setup.  
6. Explore PowerShell scripts (e.g., `Validate-System.ps1`).  
7. Read `code_conventions.md` before writing code.

---

### ✅ End of Document

