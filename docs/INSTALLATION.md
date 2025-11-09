# 📋 Guide d'Installation - LlamaRunner Pro

## 🎯 **Objectif**

Ce guide vous permet d'installer et configurer LlamaRunner Pro de manière sécurisée et fonctionnelle.

## 📦 **Prérequis Système**

### Matériel
- **CPU** : Intel/AMD x64 avec SSE4.1
- **RAM** : Minimum 16GB (recommandé 32GB+)
- **Stockage** : 50GB+ disponible pour les modèles
- **GPU** (optionnel) : NVIDIA RTX 30xx+ avec CUDA 12+

### Logiciels
- **Système** : Windows 10/11 (64-bit)
- **Python** : Version 3.11 ou supérieure
- **PowerShell** : Version 7 ou supérieure
- **Git** : Pour la gestion des versions

## 🚀 **Installation Étape par Étape**

### Étape 1 : Téléchargement du Projet
```bash
# Clonez le dépôt (ou copiez les fichiers)
git clone <repository_url>
cd llama-runner-async-proxy
```

### Étape 2 : Installation des Dépendances
```powershell
# Utilisez le menu interactif pour une installation sécurisée
.\LaunchMenu.ps1
# Sélectionnez : "📦 Installation des dépendances"
```

### Étape 3 : Configuration des Chemins
Assurez-vous que le runtime est accessible :
- **Chemin attendu** : `F:\llm\llama\llama-server.exe`
- **Droits** : L'utilisateur doit avoir le droit de lecture/exécution

### Étape 4 : Configuration Initiale
```powershell
# Lancer le gestionnaire de modèles pour créer la configuration
.\LaunchMenu.ps1
# Sélectionnez : "🤖 Gestion CORRIGÉE des modèles"
```

## ⚙️ **Configuration des Modèles**

Placez vos fichiers GGUF dans : `F:\llm\llama\models\`

Le système les détectera automatiquement et créera une configuration appropriée.

## 🔧 **Configuration Avancée**

### Ports Standard
- **LM Studio API** : 1234
- **Ollama API** : 11434
- **Web UI** : 8081
- **Dashboard Métriques** : 8080

### Modification des Ports
```powershell
.\LaunchMenu.ps1
# Sélectionnez : "⚙️  Configuration des ports"
```

## 🧪 **Validation de l'Installation**

```powershell
# Exécutez la validation complète
.\LaunchMenu.ps1
# Sélectionnez : "🔍 Validation complète du système"
```

## 🔒 **Sécurité**

- Les droits d'accès sont restreints par défaut
- Le menu interactif vérifie les permissions avant chaque action
- Les sauvegardes sont automatiques

## 🚀 **Premier Démarrage**

```powershell
.\LaunchMenu.ps1
# Sélectionnez : "🚀 Mode Proxy (Serveur principal)"
```

## ❗ **Résolution des Problèmes**

### Erreur : "Environnement virtuel non trouvé"
- Solution : Exécutez "📦 Installation des dépendances" dans le menu

### Erreur : "Ports occupés"
- Solution : Le menu libère automatiquement les ports en conflit

### Erreur : "Configuration invalide"
- Solution : Utilisez "🤖 Gestion CORRIGÉE des modèles" pour recréer la config

---

**✅ Statut** : Installation terminée avec succès
**🔧 Support** : Utilisez le menu interactif pour toutes les opérations