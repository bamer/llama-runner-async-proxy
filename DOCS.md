# 🏗️ DOCS - Documentation Centralisée Llama Runner (Refonte FastAPI)

## 🔍 Vue d'ensemble

Projet : Llama Runner Async Proxy (Refonte)  
Objectif : Interface unifiée pour modèles IA (Ollama, LM Studio servit par llama-server) avec une interface web de gestion et de monitoring basée sur FastAPI  
Principe : Separation of Concerns, code documenté, tests inclus

---


## 🧩 Architecture

### Composants principaux

| Composant | Emplacement | Description |
|----------|-------------|-------------|
| **Backend FastAPI** | `/app` | API REST/WS, gestion de l'interface web, logique de gestion | 
| **Ancien Backend** | `/llama_runner` | Composants existants réutilisés (proxies, runners) | 
| **Scripts** | `/scripts` | Outils d'automatisation |
| **Configuration** | `/config` | Fichiers de configuration JSON |
| **Logs** | `/logs` | Journaux d'exécution |
| **Modèles** | `F:\\llm\\models` | Stockage des fichiers GGUF |

---


## 🚀 Lancement

### Lancement complet (nouvelle architecture)

```bash
python run_fastapi_app.py
```

> ✅ Le backend FastAPI est accessible sur http://localhost:8000
> ✅ Les endpoints API sont disponibles sous `/api/v1/`
> ✅ Ctrl+C arrête proprement le service.

---


## 🔌 API Endpoints (v1)

| Endpoint | Méthode | Description |
|---------|---------|-------------|
| `/api/v1/health` | GET | Statut de santé de l'API |
| `/api/v1/status` | GET | Statut du système et des services |
| `/v1/models` | GET | Liste des modèles (proxy Ollama/LM Studio) |
| `/v1/chat/completions` | POST | Chat avec modèle (proxy Ollama/LM Studio) |
| `/v1/audio/transcriptions` | POST | Transcription audio (proxy Ollama/LM Studio) |
| `/v1/audio/translations` | POST | Traduction audio (proxy Ollama/LM Studio) |


### Ports
| Service | Port (par défaut) | URL |
|--------|------|-----|
| **FastAPI Backend** | 8000 | http://localhost:8000 |
| **Ollama Proxy (interne)** | 11434 | http://127.0.0.1:11434 |
| **LM Studio Proxy (interne)** | 1234 | http://127.0.0.1:1234 |

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
      },
      "auto_discovered": true,
      "auto_update_model": false
    }
  }
}
```

---


## 📁 Structure projet (Refonte)

```
llama-runner-async-proxy/
├── run_fastapi_app.py         # Point de lancement de l'API FastAPI
├── DOCS.md                  # Documentation centralisée
├── ARCHITECTURE.md          # Architecture détaillée
├── config/                  # Fichiers de configuration
├── logs/                    # Journaux
├── scripts/                 # Scripts utilitaires
├── app/                     # Backend FastAPI
│   ├── main.py              # Point d'entrée FastAPI
│   ├── core/                # Configuration, gestion des erreurs
│   ├── api/                 # Définition des routes API
│   │   └── v1/
│   │       ├── routers.py
│   │       └── endpoints/
│   │           ├── status.py
│   │           ├── health.py
│   │           ├── models.py
│   │           ├── config.py
│   │           └── monitoring.py
│   ├── models/              # Modèles Pydantic
│   ├── services/            # Logique métier réutilisant l'ancien backend
│   └── utils/               # Utilitaires
└── llama_runner/            # Ancien backend (proxies, runners) - réutilisé
    ├── headless_service_manager.py
    ├── config_loader.py
    ├── ollama_proxy_thread.py
    ├── lmstudio_proxy_thread.py
    ├── model_discovery.py
    └── services/
        ├── config_validator.py
        ├── config_updater.py
        └── metrics_collector.py
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
```

---


## 🔄 Maintenance

### Découverte automatique
- Les nouveaux modèles GGUF sont **auto-découverts** dans `F:\\llm\\models`
- Les **paramètres existants sont préservés**
- Seuls les **nouveaux modèles** sont ajoutés

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
4. **Interface utilisateur** : Backend FastAPI comme base pour l'interface de gestion
5. **Éviter les actions manuelles** : Automatiser les tâches répétitives

---


### ✅ Version actuelle : 2025-11-13

Documentation mise à jour après refonte vers FastAPI.