# 🦙 LlamaRunner Pro - Async Proxy System

**Version Phase 2 - Structure stabilisée et corrigée**

## 🎯 Présentation

LlamaRunner Pro est un système proxy asynchrone unifié qui sert d'interface entre différents modèles d'IA (LM Studio, Ollama, etc.) avec un tableau de bord web Vue.js pour le monitoring en temps réel. Le système est conçu pour être autonome, modulaire et fonctionner sur Windows/Linux.

## 🛠 Stack Technique

### Backend Python
- **Python 3.11+** avec FastAPI/uvicorn pour l'API asynchrone
- **WebSocket** pour la communication temps réel
- **psutil** pour la collecte de métriques système (CPU, mémoire, GPU)
- **PyInstaller** pour la génération d'exécutables
- **PySide6** pour une interface desktop optionnelle

### Frontend Vue.js
- **Vue.js 3** + **Element Plus** pour l'UI
- **Chart.js** pour la visualisation des données en temps réel
- **Vite** pour le build et SCSS pour le style

### Outils de développement
- **PowerShell 7+** comme interface principale (`LaunchMenu.ps1`)
- **VS Code** comme IDE recommandé
- **pytest**/**unittest** pour les tests
- **Virtualenv**/**Anaconda** pour l'environnement (pas de Docker)

## 📁 Structure du Projet (Phase 2)

```
llama-runner-async-proxy/
├── LaunchMenu.ps1               # Menu interactif principal
├── main.py                      # Point d'entrée Python
├── config/                      # Fichiers de configuration
│   ├── config.json              # Configuration générale
│   ├── models.json              # Paramètres spécifiques aux modèles
│   └── ports.json               # Mapping des ports réseau et API
├── logs/                        # Logs tournants
├── scripts/                     # Outils PowerShell
│   ├── model_management.ps1    # Gestion des modèles (.gguf)
│   ├── validate_system.ps1      # Validation système
│   ├── port_config.ps1          # Configuration réseau
│   └── debug_launch.ps1         # Mode debug
├── tests/                       # Tests unitaires et d'intégration
│   ├── unit/                    # Tests unitaires
│   └── integration/             # Tests d'intégration
├── docs/                        # Documentation
│   ├── README.md                # Ce fichier
│   ├── INSTALLATION.md          # Instructions d'installation
│   └── USAGE.md                 # Mode d'emploi
├── dashboard/                   # Frontend Vue.js + Chart.js
├── llama_runner/                # Backend Python central
│   ├── main.py                  # Serveur FastAPI principal
│   ├── proxy_manager.py         # Gestion centralisée des proxies
│   ├── config_loader.py         # Chargement et validation de configuration
│   ├── runner_manager.py        # Gestion des services de runner
│   └── services/                # Services spécialisés
│       ├── config_updater.py    # Mise à jour de configuration
│       ├── config_validator.py  # Validation de configuration
│       └── metrics_collector.py # Collecte de métriques
├── models/                      # Modèles GGUF téléchargés
├── tools/                       # Outils externes (llama-server.exe, etc.)
└── requirements.txt             # Dépendances Python
```

## 🚀 Démarrage Rapide

### 1. Configuration de l'environnement

```powershell
# Créer un environnement virtuel
python -m venv dev-venv

# Activer l'environnement
.\dev-venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r requirements.txt
```

### 2. Lancer le menu interactif

```powershell
.\LaunchMenu.ps1
```

### 3. Choisir un mode de fonctionnement

- **🚀 Mode Proxy (Serveur principal)** : Proxy asynchrone pour tous les modèles
- **🦙 Mode Llama.cpp seul** : Uniquement le serveur llama.cpp
- **🌐 Mode Proxy + WebUI** : Proxy avec interface web
- **📊 Mode Proxy + WebUI + Dashboard** : Proxy avec monitoring temps réel
- **🔧 Mode Développement (Debug)** : Logs détaillés et debugging
- **🧪 Tests du système** : Exécuter la suite de tests

## 🔍 Validation du Système

Avant de démarrer, validez votre configuration :

```powershell
.\scripts\validate_system.ps1
```

Ce script vérifie :
- ✅ Disponibilité des ports (1234, 11434, 8035)
- ✅ Environnement Python et dépendances
- ✅ Structure du projet
- ✅ Configuration des modèles

## 🧪 Tests Automatisés

Exécutez les tests unitaires :

```powershell
pytest tests/
```

## 📝 Documentation Complète

- **[INSTALLATION.md](INSTALLATION.md)** : Instructions d'installation détaillées
- **[USAGE.md](USAGE.md)** : Guide d'utilisation complet
- **[CONTRIBUTING.md](CONTRIBUTING.md)** : Guide pour les contributeurs

## 🔐 Sécurité et Configuration

- **Ports standards** :
  - LM Studio API : **1234**
  - Ollama API : **11434**
  - Dashboard Web : **8035**

- **Permissions** : Les fichiers sensibles ont des permissions restreintes
- **Déploiement** : Local uniquement, avec venv ou Anaconda, pas de Docker

## 🤝 Contribution

Nous suivons des principes stricts pour les contributeurs :

- **Sécurité** : Ne jamais supprimer de fichiers sans analyse préalable
- **Qualité** : Commits atomiques et significatifs
- **Tests** : Jamais ignorer les diagnostics de haute sévérité
- **Documentation** : Documenter chaque changement fonctionnel
- **Typage** : Suivre à 100% les conventions de typage et de nommage
- **Validation** : Exécuter tous les tests localement avant de committer

## 🆘 Support et Débogage

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** : `logs/app.log` et `logs/launch_menu.log`
2. **Exécutez la validation** : `.\scripts\validate_system.ps1`
3. **Mode debug** : Utilisez `.\LaunchMenu.ps1` → "🔧 Mode Développement"
4. **Issues GitHub** : Créez une issue avec les logs et étapes de reproduction

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](../LICENSE) pour plus de détails.

---

**Projet stabilisé en Phase 2** ✅  
Structure corrigée, chemins relatifs, imports fixés, documentation minimale créée.