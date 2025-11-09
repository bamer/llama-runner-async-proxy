# 📖 Guide d'Utilisation - LlamaRunner Pro

**Version Phase 2 - Instructions claires et modes d'emploi**

## 🎯 Modes de Fonctionnement Disponibles

LlamaRunner Pro propose plusieurs modes d'opération accessibles via le menu interactif :

### 🚀 Mode Proxy (Serveur principal)
- **Description** : Proxy asynchrone pour tous les modèles d'IA
- **Ports** : 1234 (LM Studio API), 11434 (Ollama API)
- **Commande** : `.\LaunchMenu.ps1` → Choisir "🚀 Mode Proxy (Serveur principal)"
- **Cas d'usage** : Utilisation comme interface unifiée pour multiple backends d'IA

### 🦙 Mode Llama.cpp seul
- **Description** : Démarrage direct du serveur llama.cpp avec un modèle spécifique
- **Ports** : 8035 (serveur llama.cpp)
- **Commande** : `.\LaunchMenu.ps1` → Choisir "🦙 Mode Llama.cpp seul"
- **Cas d'usage** : Tests de performance d'un modèle unique, développement

### 🌐 Mode Proxy + WebUI
- **Description** : Proxy avec interface web pour le contrôle des modèles
- **Ports** : 1234, 11434 + 8081 (interface web)
- **Commande** : `.\LaunchMenu.ps1` → Choisir "🌐 Mode Proxy + WebUI"
- **Cas d'usage** : Utilisation interactive via navigateur web

### 📊 Mode Proxy + WebUI + Dashboard
- **Description** : Proxy complet avec monitoring temps réel des métriques système
- **Ports** : 1234, 11434 + 8081 (web UI) + 8035 (dashboard)
- **Commande** : `.\LaunchMenu.ps1` → Choisir "📊 Mode Proxy + WebUI + Dashboard"
- **Cas d'usage** : Monitoring production, visualisation des performances

### 🔧 Mode Développement (Debug)
- **Description** : Mode avec logs détaillés et debugging activé
- **Ports** : Tous les ports activés
- **Commande** : `.\LaunchMenu.ps1` → Choisir "🔧 Mode Développement (Debug)"
- **Cas d'usage** : Développement, debugging, tests avancés

## 🖥 Interface Utilisateur

### Menu Interactif (LaunchMenu.ps1)
```
╔════════════════════════════════════════════╗
║    🦙 MENU INTERACTIF - PHASE 2 STABLE    ║
║      Structure corrigée et simplifiée     ║
╚════════════════════════════════════════════╝

📊 ÉTAT ACTUEL DU PROJET :
   📁 Répertoire projet: F:\llm\llama-runner-async-proxy
   🐍 Python: .\dev-venv\Scripts\python.exe

  > 🚀 Mode Proxy (Serveur principal)
    🦙 Mode Llama.cpp seul
    🌐 Mode Proxy + WebUI
    📊 Mode Proxy + WebUI + Dashboard
    🔧 Mode Développement (Debug)
    🧪 Tests du système
    📦 Installation des dépendances
    ⚙️  Configuration des ports
    🔍 Validation complète du système
    🤖 Gestion des modèles
    🔄 Mise à jour config
    ❌ Quitter
```

**Commandes de navigation** :
- **Flèches haut/bas** : Sélectionner une option
- **Entrée** : Exécuter l'option sélectionnée
- **Échap** : Quitter l'application

### Interface Web (Mode WebUI)
Accédez à l'interface web via : `http://localhost:8081`

**Fonctionnalités disponibles** :
- 📋 Liste des modèles disponibles
- ▶️ Démarrage/arrêt des modèles
- ⚙️ Configuration des paramètres
- 📊 Visualisation des métriques basiques
- 🔧 Gestion des ports et configuration

### Tableau de Bord (Mode Dashboard)
Accédez au dashboard via : `http://localhost:8035`

**Métriques affichées en temps réel** :
- 📈 Utilisation CPU (%)
- 💾 Utilisation mémoire (GB)
- 🎮 Utilisation GPU (% et mémoire)
- ⚡ Latence des requêtes (ms)
- 🔄 Taux de requêtes par seconde
- 📊 État des modèles (démarré/arrêté)

## 🤖 Gestion des Modèles

### Via le menu interactif
```powershell
.\LaunchMenu.ps1 → 🤖 Gestion des modèles
```

**Opérations disponibles** :
- 🔍 **Découverte automatique** : Scan du dossier `models/` pour nouveaux modèles
- 📥 **Import manuel** : Ajout d'un modèle existant
- 🗑️ **Suppression** : Retrait d'un modèle de la configuration
- 🔄 **Mise à jour** : Actualisation des métadonnées d'un modèle
- ⚙️ **Configuration** : Modification des paramètres d'un modèle

### Manuellement via configuration
Éditez le fichier `config/config.json` :

```json
{
  "models": {
    "mon-nouveau-modele": {
      "model_path": "models/mon-nouveau-modele.Q4_K_M.gguf",
      "llama_cpp_runtime": "llama-server",
      "parameters": {
        "ctx_size": 32000,
        "temp": 0.7,
        "batch_size": 512,
        "n_gpu_layers": 45,
        "port": 8036  // Port unique par modèle
      },
      "display_name": "Mon Nouveau Modèle",
      "auto_discovered": false
    }
  },
  "default_model": "mon-nouveau-modele"
}
```

**Après modification** : Redémarrez l'application pour appliquer les changements.

## 🔌 API et Intégrations

### LM Studio Compatible API
**Endpoint** : `http://localhost:1234`

**Exemple cURL** :
```bash
curl http://localhost:1234/api/v0/models
curl http://localhost:1234/api/v0/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mon-modele",
    "messages": [{"role": "user", "content": "Bonjour!"}],
    "stream": false
  }'
```

### Ollama Compatible API
**Endpoint** : `http://localhost:11434`

**Exemple cURL** :
```bash
curl http://localhost:11434/api/tags
curl http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mon-modele",
    "prompt": "Bonjour!",
    "stream": false
  }'
```

### OpenAI Compatible API
**Endpoint** : `http://localhost:1234/v1`

**Exemple cURL** :
```bash
curl http://localhost:1234/v1/models
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mon-modele",
    "messages": [{"role": "user", "content": "Bonjour!"}]
  }'
```

## 🎵 Fonctionnalités Audio (Whisper)

### Transcription audio
**Endpoint** : `http://localhost:1234/v1/audio/transcriptions`

**Exemple Python** :
```python
import requests

url = "http://localhost:1234/v1/audio/transcriptions"
files = {"file": open("audio.wav", "rb")}
data = {"model": "whisper-tiny"}

response = requests.post(url, files=files, data=data)
print(response.json())
```

### Traduction audio
**Endpoint** : `http://localhost:1234/v1/audio/translations`

**Exemple Python** :
```python
url = "http://localhost:1234/v1/audio/translations"
files = {"file": open("audio.wav", "rb")}
data = {"model": "whisper-tiny", "language": "en"}

response = requests.post(url, files=files, data=data)
print(response.json())
```

## 📊 Monitoring et Logs

### Fichiers de logs
- `logs/app.log` : Logs principaux de l'application
- `logs/launch_menu.log` : Logs du menu de lancement
- `logs/validation.log` : Logs de validation système
- `logs/model_management.log` : Logs de gestion des modèles

### Format des logs
```
[2025-11-09 18:58:24] [INFO] Démarrage du proxy LM Studio sur le port 1234
[2025-11-09 18:58:25] [DEBUG] Modèle 'JanusCoderV-7B.i1-Q4_K_S' chargé avec succès
[2025-11-09 18:58:30] [WARNING] Port 8035 déjà utilisé, utilisation du port alternatif 8036
[2025-11-09 18:58:35] [ERROR] Erreur de démarrage du runner pour le modèle 'autre-modele'
```

### Surveillance système
Utilisez la commande PowerShell pour surveiller les ressources :
```powershell
# Surveillance CPU et mémoire
Get-Process python | Select-Object CPU, WS, PM, VM

# Surveillance des ports
Get-NetTCPConnection -LocalPort @(1234,11434,8035,8081) | Select-Object LocalPort, State
```

## 🧪 Tests et Validation

### Exécuter les tests unitaires
```powershell
pytest tests/
```

### Exécuter les tests d'intégration
```powershell
pytest tests/integration/
```

### Validation système complète
```powershell
.\scripts\validate_system.ps1
```

## ⚙️ Maintenance et Mise à Jour

### Sauvegarde de configuration
```powershell
# Sauvegarde manuelle
copy config\config.json config\config_backup_$(Get-Date -Format "yyyyMMdd_HHmmss").json
```

### Mise à jour des dépendances
```powershell
pip install -r requirements.txt --upgrade
```

### Nettoyage des caches
```powershell
# Nettoyer les caches Python
rm -rf __pycache__
rm -rf *.pyc

# Nettoyer les logs anciens
Get-ChildItem logs\*.log -Recurse | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
```

## 🚨 Problèmes Courants et Solutions

### Erreur au démarrage
**Symptôme** : L'application ne démarre pas, logs vides
**Solutions** :
1. Vérifiez l'environnement Python : `.\dev-venv\Scripts\python.exe --version`
2. Exécutez la validation : `.\scripts\validate_system.ps1`
3. Essayez le mode debug : `.\LaunchMenu.ps1` → "🔧 Mode Développement"

### Modèle ne démarre pas
**Symptôme** : Timeout au démarrage du modèle
**Solutions** :
1. Vérifiez le chemin du fichier GGUF dans `config.json`
2. Assurez-vous que le runtime (`llama-server.exe`) est dans `tools/`
3. Réduisez `n_gpu_layers` si vous n'avez pas assez de VRAM
4. Augmentez le timeout dans le code source (si nécessaire)

### Problèmes de performance
**Symptôme** : Réponses lentes, latence élevée
**Solutions** :
1. Réduisez `ctx_size` pour les modèles trop gros
2. Ajustez `batch_size` et `ubatch_size`
3. Vérifiez l'utilisation GPU avec `nvidia-smi`
4. Fermez d'autres applications consommatrices de ressources

### Problèmes de mémoire
**Symptôme** : Erreurs de mémoire insuffisante
**Solutions** :
1. Utilisez des modèles quantifiés (Q4_K_M au lieu de Q8_0)
2. Réduisez `ctx_size`
3. Fermez d'autres modèles en cours d'exécution
4. Ajoutez de la mémoire SWAP si nécessaire

## 📞 Support et Communauté

### Canaux de support
- **Issues GitHub** : Pour les bugs et fonctionnalités
- **Discussions** : Pour les questions et aide
- **Documentation** : Toujours la première référence

### Contribuer
1. Fork le dépôt
2. Créez une branche pour votre fonctionnalité
3. Soumettez une pull request
4. Suivez les conventions de code et les tests

### Rapporter un bug
Fournissez toujours :
- Votre environnement (OS, Python version)
- Les étapes pour reproduire
- Le contenu des logs pertinents
- Le résultat attendu vs le résultat réel

---

**✅ Vous êtes prêt !**  
Avec ce guide, vous devriez être en mesure d'utiliser pleinement LlamaRunner Pro dans tous ses modes. N'hésitez pas à consulter les autres documents de documentation pour des informations plus détaillées.