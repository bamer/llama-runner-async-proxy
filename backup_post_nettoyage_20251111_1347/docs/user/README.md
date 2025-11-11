# 🦙 LlamaRunner Pro - Proxy IA Asynchrone

## 🎯 **Présentation**

LlamaRunner Pro est un proxy asynchrone avancé pour modèles de langage IA, offrant une interface unifiée pour LM Studio, Ollama et d'autres services. Conçu pour être portable, sécurisé et évolutif.

## 🚀 **Fonctionnalités Principales**

- **🔄 Proxy Multi-Plateforme** : Support natif LM Studio (port 1234) et Ollama (port 11434)
- **🌐 Interface Web** : Dashboard interactif sur port 8081
- **📊 Monitoring Temps Réel** : Métriques sur port 8080
- **🤖 Gestion Intelligente des Modèles** : Scan et configuration automatique des modèles GGUF
- **🔧 Mode Développement** : Logs détaillés et outils de debugging
- **⚡ Performance Optimisée** : Support GPU, gestion mémoire avancée
- **🔒 Sécurité Renforcée** : Isolation des processus, droits restreints

## 📦 **Architecture du Projet**

```
llama-runner-async-proxy/
├── LaunchMenu.ps1               # Point d'entrée unique (menu interactif)
├── main.py                      # Application principale
├── config.json                  # Configuration principale
├── logs/                        # Dossiers des logs
├── config/                      # Fichiers de configuration
├── scripts/                     # Scripts utilitaires
│   ├── model_management.ps1     # : Gestion robuste des modèles
│   ├── Validate-System.ps1      # Validation complète
│   ├── PortConfig.ps1           # Configuration des ports
│   └── Debug-Launch.ps1         # Mode debug avancé
├── tests/                       # Tests unitaires et d'intégration
│   └── test_implementation_validation.py  # ✅ Mis à jour
├── documentation/               # Documentation complète
│   ├── README.md                # ✅ Ce fichier
│   ├── INSTALLATION.md          # Guide d'installation
│   └── USAGE.md                 # Guide d'utilisation
├───dashborad /                  # Dashboard avec graph et monitoring temps reel vu.js
└── llama_runner/                # Code source Python
```

## **🔧 Cross-Platform Technical Stack:**

```
🌐 Frontend (Cross-Platform):
├── Vue.js 3 (JavaScript - Universal)
├── Element Plus (React-based components - Universal)  
├── Chart.js (Universal charting)
├── Vite (Universal build tool)
└── SCSS (Universal styling)

💻 Backend (Cross-Platform):
├── Python 3.11+ (Universal)
├── PySide6 (Universal GUI framework)
├── FastAPI/uvicorn (Universal web server)
├── WebSocket (Universal real-time)
└── PSUtil (Universal system monitoring)

🐳 Deployment (Cross-Platform):
├── Docker (Universal containerization)
├── Electron (Universal desktop app)
├── PyInstaller (Universal executable)
└── pip (Universal package manager)


## ⚙️ **Configuration par Défaut (Ports Standards)**

| Service | Port | URL |
|---------|------|-----|
| **LM Studio API** | 1234 | http://localhost:1234 |
| **Ollama API** | 11434 | http://localhost:11434 |
| ****Dashboard Interface Web** | 8035 | http://localhost:8035 |

## 🚀 **Démarrage Rapide**

### 1. **Prérequis**
- Python 3.11+
- PowerShell 7+
- Accès à `F:\llm\llama\llama-server.exe`

### 2. **Premier démarrage**
```powershell
.\LaunchMenu.ps1 
```

### 3. **Configuration des Modèles (OPTIONNEL mais recommandé)**
```powershell
# Dans le menu, sélectionnez :
# "🤖 Gestion des modèles"
```

### 4. **Lancement du proxy**
```powershell
# Dans le menu, sélectionnez :
# "🚀 Mode Proxy (Serveur principal)"
```

## 🧪 **Exécution des Tests**

### Depuis le menu interactif :
```powershell
.\LaunchMenu.ps1
# Sélectionnez "🧪 Tests du système"
```

### En ligne de commande :
```powershell
.\dev-venv\Scripts\python.exe tests\test_implementation_validation.py
```

## 🔧 **Résolution des Problèmes Courants**

### Problème : "null key is not allowed in a hash literal"
**Solution** : ✅ dans la version actuelle
- Le script de gestion des modèles génère maintenant des noms valides
- Configuration minimale de secours si nécessaire

### Problème : "usage: main.py [-h] [--log-level...] arguments invalides"
**Solution** : ✅ dans la version actuelle
- Le menu utilise maintenant `main.py` original avec arguments compatibles
- Plus d'utilisation de `main_fixed.py` cassé

### Problème : "Ports occupés"
**Solution** : ✅ dans la version actuelle
- Le menu vérifie automatiquement la disponibilité des ports
- Libération sécurisée avec confirmation utilisateur

### Problème : "Aucun modèle valide trouvé"
**Solution** :
1. Vérifiez que vos fichiers `.gguf` sont dans `F:\llm\llama\models\`
2. Assurez-vous qu'ils font plus de 100MB
3. Le script générera des noms par défaut si nécessaire

## 📝 **Contributions et Maintenance**

- **Tests** : Toute nouvelle fonctionnalité doit inclure des tests unitaires
- **Documentation** : Mettre à jour la documentation pour chaque changement majeur
- **Sécurité** : Les droits d'accès doivent être restreints sur les fichiers sensibles

## 🎯 **Statut Actuel**

- ✅ **Menu interactif fonctionnel** : Point d'entrée unique
- ✅ **Gestion des modèles corrigée** : Plus d'erreurs de clés nulles
- ✅ **Compatibilité main.py** : Arguments corrects, ports standards
- ✅ **Configuration minimale sécurisée** : Fonctionne même sans modèles
- ✅ **Tests fonctionnels** : Validation complète du système
- ✅ **Sécurité renforcée** : Droits restreints sur les fichiers critiques

## 🚀 **Prochaines Étapes**

- [ ] Ajouter plus de tests unitaires
- [ ] Améliorer la documentation des API
- [ ] Ajouter des exemples d'utilisation
- [ ] Optimiser les performances GPU

---

**🚀 Statut** : **OPÉRATIONNEL ET STABLE**  
**🔧 Version** : 1.0 Pro 
**📅 Dernière mise à jour** : 2025-11-07  
**⚡ Temps de démarrage** : < 5 secondes