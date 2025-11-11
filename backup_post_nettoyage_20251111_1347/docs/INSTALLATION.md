# 📋 Guide d'Installation - LlamaRunner Pro

**Version Phase 2 - Instructions claires et vérifiées**

## 🎯 Prérequis Système

### Configuration minimale requise
- **Système d'exploitation** : Windows 10/11 ou Linux (Ubuntu 20.04+)
- **Processeur** : 4 cœurs physiques minimum
- **Mémoire RAM** : 16 GB minimum (32 GB recommandé pour les grands modèles)
- **Stockage** : 50 GB d'espace disque SSD (pour les modèles GGUF)
- **GPU** : NVIDIA avec 8+ GB VRAM (recommandé pour l'inférence accélérée)

### Logiciels requis
- **Python 3.11+** ([Télécharger Python](https://www.python.org/downloads/))
- **PowerShell 7+** ([Télécharger PowerShell](https://github.com/PowerShell/PowerShell))
- **VS Code** (recommandé) ([Télécharger VS Code](https://code.visualstudio.com/))
- **Git** ([Télécharger Git](https://git-scm.com/))

## 🚀 Installation Pas à Pas

### 1. Cloner le dépôt
```powershell
git clone https://github.com/votre-repo/llama-runner-async-proxy.git
cd llama-runner-async-proxy
```

### 2. Configurer l'environnement Python

#### Option A : Virtualenv (recommandé)
```powershell
# Créer l'environnement virtuel
python -m venv dev-venv

# Activer l'environnement
.\dev-venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r requirements.txt
```

#### Option B : Anaconda
```powershell
# Créer l'environnement conda
conda create -n llama python=3.11 -y

# Activer l'environnement
conda activate llama

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Vérifier l'installation Python
```powershell
python --version
# Devrait afficher : Python 3.11.x

pip list
# Devrait afficher toutes les dépendances installées
```

### 4. Configurer les dossiers de travail
Le projet créera automatiquement les dossiers nécessaires :
- `config/` - Configuration
- `logs/` - Fichiers de log
- `models/` - Modèles GGUF
- `tools/` - Outils externes

### 5. Télécharger les outils externes (optionnel mais recommandé)

#### Pour Windows :
1. Téléchargez `llama-server.exe` depuis [llama.cpp releases](https://github.com/ggerganov/llama.cpp/releases)
2. Placez-le dans le dossier `tools/`
3. Configurez le chemin dans `config/config.json`

#### Pour Linux :
```powershell
# Compiler llama.cpp (optionnel)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make -j$(nproc)
cp ./bin/server ../tools/llama-server
```

## 🔧 Configuration Initiale

### 1. Générer la configuration par défaut
La première exécution créera une configuration par défaut :
```powershell
.\LaunchMenu.ps1
```

### 2. Configurer les modèles
Éditez le fichier `config/config.json` pour ajouter vos modèles :

```json
{
  "models": {
    "mon-modele-7b": {
      "model_path": "models/mon-modele-7b.Q4_K_M.gguf",
      "llama_cpp_runtime": "llama-server",
      "parameters": {
        "ctx_size": 32000,
        "temp": 0.7,
        "n_gpu_layers": 45,
        "port": 8035
      }
    }
  },
  "default_model": "mon-modele-7b"
}
```

### 3. Configurer les proxies
Dans `config/config.json`, configurez les ports des proxies :

```json
{
  "proxies": {
    "ollama": {
      "enabled": true,
      "port": 11434
    },
    "lmstudio": {
      "enabled": true,
      "port": 1234
    }
  }
}
```

## 🧪 Validation de l'Installation

### 1. Exécuter le script de validation
```powershell
.\scripts\validate_system.ps1
```

### 2. Résultats attendus
✅ **Succès** :
```
🎉 VALIDATION RÉUSSIE - PHASE 2 !
✅ Le système est prêt à démarrer avec la nouvelle structure.
🚀 Utilisez: ..\LaunchMenu.ps1 pour démarrer l'application.
```

❌ **Échec** - Problèmes courants et solutions :

#### Problème : Environnement Python non trouvé
```powershell
❌ Python non trouvé: F:\llm\llama-runner-async-proxy\dev-venv\Scripts\python.exe
```
**Solution** :
```powershell
# Recréer l'environnement virtuel
python -m venv dev-venv
.\dev-venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### Problème : Modules Python manquants
```powershell
❌ Modules manquants: psutil, websockets, fastapi
```
**Solution** :
```powershell
pip install psutil websockets fastapi uvicorn
```

#### Problème : Ports occupés
```powershell
⚠️  Port 1234 déjà utilisé
```
**Solution** :
```powershell
# Configurer de nouveaux ports
.\scripts\port_config.ps1
```

## 🎮 Démarrage Initial

### 1. Lancer le menu interactif
```powershell
.\LaunchMenu.ps1
```

### 2. Choisir le mode de démarrage
Pour la première utilisation, choisissez **"🚀 Mode Proxy (Serveur principal)"**

### 3. Vérifier les logs
Les logs sont écrits dans :
- `logs/app.log` - Logs de l'application
- `logs/launch_menu.log` - Logs du menu de lancement

## ⚙️ Configuration Avancée

### Configuration GPU
Pour les utilisateurs NVIDIA :
```json
{
  "models": {
    "mon-modele": {
      "parameters": {
        "n_gpu_layers": 45,
        "cuda_visible_devices": "0"
      }
    }
  }
}
```

### Configuration multi-modèles
```json
{
  "concurrentRunners": 2,
  "models": {
    "modele-a": { ... },
    "modele-b": { ... }
  }
}
```

### Configuration audio (Whisper)
```json
{
  "audio": {
    "models": {
      "whisper-large-v3": {
        "model_path": "models/whisper-large-v3",
        "parameters": {
          "device": "cuda",
          "compute_type": "float16"
        }
      }
    }
  }
}
```

## 🛠 Dépannage Courant

### Problème : Import error après installation
**Erreur** :
```python
ImportError: cannot import name 'calculate_system_fingerprint' from 'llama_runner.config_loader'
```
**Solution** : Cela a été corrigé dans la Phase 2. Assurez-vous d'utiliser la dernière version du code.

### Problème : Démarrage du serveur échoue
**Solution** :
1. Vérifiez les logs dans `logs/app.log`
2. Exécutez la validation : `.\scripts\validate_system.ps1`
3. Essayez le mode debug : `.\LaunchMenu.ps1` → "🔧 Mode Développement"

### Problème : Modèles non détectés
**Solution** :
1. Vérifiez que les chemins dans `config.json` sont corrects
2. Utilisez des chemins relatifs : `models/mon-modele.gguf` au lieu de `F:\llm\...\mon-modele.gguf`
3. Redémarrez l'application après modification de la configuration

## 🔄 Mise à Jour

Pour mettre à jour le projet :
```powershell
# Sauvegarder votre configuration
copy config\config.json config\config_backup.json

# Mettre à jour le code
git pull

# Mettre à jour les dépendances
pip install -r requirements.txt --upgrade

# Relancer la validation
.\scripts\validate_system.ps1
```

## 📞 Support

Si vous rencontrez des problèmes persistants :
- Vérifiez les [issues GitHub](https://github.com/votre-repo/llama-runner-async-proxy/issues)
- Créez une nouvelle issue avec :
  - Votre système d'exploitation
  - La version de Python
  - Le contenu de `logs/app.log`
  - Les étapes pour reproduire le problème

---

**✅ Installation réussie !**  
Vous êtes maintenant prêt à utiliser LlamaRunner Pro avec la structure Phase 2 stabilisée.