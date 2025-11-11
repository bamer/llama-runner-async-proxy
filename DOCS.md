# 🏗️ DOCS - Documentation Centralisée Llama Runner

## 🔍 Vue d'ensemble

Projet : Llama Runner Async Proxy  
Objectif : Interface unifiée pour modèles IA (Ollama, LM Studio) avec dashboard moderne  
Principe : Separation of Concerns, code documenté, tests inclus

---


## 🧩 Architecture

### Composants principaux

| Composant | Emplacement | Description |
|----------|-------------|-------------|
| **Backend Python** | `/llama_runner` | Gestion des runners, proxies, modèles |
| **Dashboard Web** | `/dashboard` | Interface Vue.js pour gestion et monitoring |
| **Scripts** | `/scripts` | Outils d'automatisation |
| **Configuration** | `/config` | Fichiers de configuration JSON |
| **Logs** | `/logs` | Journaux d'exécution |
| **Modèles** | `F:\\llm\\models` | Stockage des fichiers GGUF |

### Communication

```
[Vue.js Dashboard] <---> [Backend Python] <---> [Llama.cpp Runners]
     (Port 8080)           (Port 8585)           (Ports dynamiques)
         |                       |                      |
         | HTTP/WS API          | API REST               | Processus locaux
         |----------------------|------------------------|
```

---


## 🚀 Lancement

### Script simplifié (`LaunchMenu.ps1`)

- **🚀 Mode Proxy (Serveur principal)** : Proxies Ollama + LM Studio
- **🦙 Mode Llama.cpp seul** : Direct llama-server.exe
- **🌐 Mode Proxy + WebUI** : Avec interface web
- **🔧 Mode Développement (Debug)** : Logs détaillés
- **🔍 Validation système** : Vérification d'intégrité
- **❌ Quitter** : Sortie du menu

> ⚠️ Toute la configuration se fait via le **dashboard**, pas via PowerShell.

---


## 🔌 API Endpoints

| Endpoint | Méthode | Description |
|---------|---------|-------------|
| `/v1/models` | GET | Liste des modèles |
| `/v1/chat/completions` | POST | Chat avec modèle |
| `/v1/audio/transcriptions` | POST | Transcription audio |
| `/v1/audio/translations` | POST | Traduction audio |
| `/health` | GET | Statut du système |


### Ports
| Service | Port | URL |
|--------|------|-----|
| **Dashboard Web** | 8080 | http://localhost:8080 |
| **Backend API** | 8585 | http://localhost:8585 |
| **Ollama Proxy** | 11434 | http://localhost:11434 |
| **LM Studio Proxy** | 1234 | http://localhost:1234 |
| **llama-server (direct)** | 8035 | http://localhost:8035 |

---


## 🛠 Configuration

### Fichiers clés

- `config/app_config.json` : Configuration globale
- `config/models_config.json` : Liste des modèles et paramètres

### Structure models_config.json
```json
{
  "default_model": "qwen2.5-7b-instruct",
  "models": {
    "qwen2.5-7b-instruct": {
      "model_path": "..\\models\\qwen2.5-7b-instruct-q4_k_m.gguf",
      "llama_cpp_runtime": "llama-server",
      "parameters": {
        "ctx_size": 16000,
        "n_gpu_layers": 50,
        "temp": 0.6
      }
    }
  }
}
```

> ✅ La configuration se fait **via le dashboard**, pas manuellement.

---


## 📁 Structure projet

```
llama-runner-async-proxy/
├── LaunchMenu.ps1           # Lanceur simplifié
├── main.py                  # Point d'entrée principal
├── DOCS.md                  # Documentation centralisée
├── ARCHITECTURE.md          # Architecture détaillée
├── config/                  # Fichiers de configuration
├── logs/                    # Journaux
├── scripts/                 # Scripts utilitaires
├── dashboard/               # Interface Vue.js
└── llama_runner/            # Backend Python
    ├── headless_service_manager.py
    ├── config_loader.py
    ├── ollama_proxy_thread.py
    ├── lmstudio_proxy_thread.py
    └── model_discovery.py
```

---


## 🧪 Tests

### Répertoires
- `/tests` : Tous les tests unitaires et d'intégration

### Commandes
```bash
# Exécuter tous les tests
python -m pytest tests/

# Validation système
powershell .\\scripts\\validate_system.ps1
```

---


## 🔧 Environnement

### Prérequis
- Python 3.11+
- Node.js 16+ (pour le dashboard)
- PowerShell 7+
- VS Code

### Installation
```powershell
# Créer l'environnement virtuel
python -m venv dev-venv

# Activer
dev-venv\\Scripts\\Activate.ps1

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le backend
python main.py --headless

# Démarrer le dashboard
cd dashboard
npm run dev
```

---


## 🔄 Maintenance

### Nettoyage
- Suppression automatique des fichiers de cache
- Rotation des logs

### Sauvegarde
- Configurations sauvegardées automatiquement avant modification
- Backup manuel possible via copie du dossier `config/`

---


## 🎯 Principes de développement

1. **Separation of Concerns** : Chaque composant a une responsabilité unique
2. **Code documenté** : Commentaires précis, typage strict, variables explicites
3. **Tests inclus** : Assurer la fiabilité et la maintenance
4. **Interface utilisateur** : Dashboard Vue.js comme point central de gestion
5. **Éviter les actions manuelles** : Automatiser les tâches répétitives

---


### ✅ Version actuelle : 2025-11-11

Documentation mise à jour après restructuration complète.