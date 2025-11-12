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

### Lancement complet (recommandé)

```bash
python launch_dashboard.py
```

> ⚠️ Cela lance **automatiquement** le backend Python **et** le dashboard Vue.js
> ✅ Le dashboard est accessible sur http://localhost:8080
> ✅ Ctrl+C arrête proprement les deux services

### Lancement manuel

#### Backend seulement
```bash
python main.py --log-level INFO
```

> ✅ Proxies Ollama (11434) et LM Studio (1234) démarrés
> ✅ API Dashboard sur port 8585
> ✅ Dashboard Web sur port 8080 (nécessite lancement séparé du dashboard)

#### Dashboard seulement
```bash
cd dashboard && npm run dev
```

> ✅ Dashboard accessible sur http://localhost:8080
> ✅ Communique avec le backend sur http://localhost:8585

---


## 🔌 API Endpoints

| Endpoint | Méthode | Description |
|---------|---------|-------------|
| `/v1/models` | GET | Liste des modèles |
| `/v1/chat/completions` | POST | Chat avec modèle |
| `/v1/audio/transcriptions` | POST | Transcription audio |
| `/v1/audio/translations` | POST | Traduction audio |
| `/api/status` | GET | Statut du système (dashboard) |
| `/api/health` | GET | Statut de santé (dashboard) |
| `/health` | GET | Statut du système |


### Ports
| Service | Port | URL |
|--------|------|-----|
| **Dashboard Web** | 8080 | http://localhost:8080 |
| **Dashboard API** | 8585 | http://localhost:8585 |
| **Ollama Proxy** | 11434 | http://localhost:11434 |
| **LM Studio Proxy** | 1234 | http://localhost:1234 |

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

> ✅ La configuration se fait **via le dashboard**, pas manuellement.
> ✅ Les nouveaux modèles sont **auto-découverts** sans écraser les paramètres existants.

---


## 📁 Structure projet

```
llama-runner-async-proxy/
├── launch_dashboard.py      # Lance backend + dashboard
├── main.py                  # Backend seulement
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
    ├── model_discovery.py
    └── services/
        ├── config_validator.py
        ├── config_updater.py
        ├── metrics_collector.py
        └── dashboard_api.py
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

# Installer les dépendances du dashboard
cd dashboard && npm install
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
4. **Interface utilisateur** : Dashboard Vue.js comme point central de gestion
5. **Éviter les actions manuelles** : Automatiser les tâches répétitives
6. **Arrêt propre** : Ctrl+C arrête tous les services correctement

---


### ✅ Version actuelle : 2025-11-12

Documentation mise à jour après correction complète des problèmes.