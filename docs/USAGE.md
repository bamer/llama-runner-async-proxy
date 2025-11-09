# 📖 Guide d'Utilisation - LlamaRunner Pro

## 🎯 **Objectif**

Ce guide explique comment utiliser efficacement LlamaRunner Pro après l'installation.

## 🏁 **Démarrage Rapide**

### Méthode Recommandée : Menu Interactif
```powershell
.\LaunchMenu.ps1
```

Le menu est le **point d'entrée unique** pour toutes les opérations.

## 🎮 **Navigation dans le Menu**

| Option | Fonction | Description |
|--------|----------|-------------|
| 🚀 Mode Proxy | Démarrage principal | Démarre les APIs LM Studio et Ollama |
| 🌐 Mode Proxy + WebUI | Interface web | Ajoute l'interface web au proxy |
| 📊 Mode Complet | Dashboard + WebUI | Toutes les fonctionnalités |
| 🧪 Tests | Validation | Exécute les tests du système |
| 🤖 Gestion des modèles | Configuration | Scan et configuration des modèles GGUF |
| ⚙️  Configuration | Ports | Gestion des ports d'écoute |

## 🤖 **Gestion des Modèles**

### Procédure Recommandée
1. Placez vos fichiers `.gguf` dans `F:\llm\llama\models\`
2. Lancez le menu interactif
3. Sélectionnez "🤖 Gestion CORRIGÉE des modèles"
4. Le système détecte automatiquement les modèles valides
5. Sélectionnez le modèle à configurer

### Caractéristiques de la Gestion des Modèles
- **Scan automatique** des fichiers `.gguf` > 100MB
- **Génération de noms** pour les fichiers avec noms invalides
- **Gestion des doublons** intelligente
- **Configuration sécurisée** sans erreurs de clés nulles

## 🚀 **Démarrage du Proxy**

### Modes Disponibles

#### 1. Mode Proxy (Minimal)
- **Ports** : 1234 (LM Studio), 11434 (Ollama)
- **Fonction** : API de base pour les modèles

#### 2. Mode WebUI
- **Ports** : 1234, 11434, 8081 (WebUI)
- **Fonction** : Proxy + interface web

#### 3. Mode Complet
- **Ports** : 1234, 11434, 8080 (Dashboard), 8081 (WebUI)
- **Fonction** : Tout inclus avec monitoring

## 🧪 **Exécution des Tests**

### Via Menu Interactif
```powershell
.\LaunchMenu.ps1
# Sélectionnez : "🧪 Tests du système"
```

### En Ligne de Commande
```powershell
.\dev-venv\Scripts\python.exe tests\test_implementation_validation.py
```

## 📊 **Monitoring et Logs**

### Emplacements des Logs
- **Menu** : `logs\launch_menu.log`
- **Application** : `logs\app.log`
- **Modèles** : `logs\model_management.log`
- **Validation** : `logs\validation.log`

### Dashboard Métriques
Accessible sur : `http://localhost:8080`

## 🔧 **Dépannage**

### Problème : "Le port X est occupé"
- **Solution** : Le menu libère automatiquement les ports occupés
- **Action** : Confirmez l'arrêt des processus en conflit

### Problème : "Aucun modèle trouvé"
- **Cause** : Fichiers `.gguf` manquants ou < 100MB
- **Solution** : Placez des fichiers GGUF valides dans `F:\llm\llama\models\`

### Problème : "Configuration invalide"
- **Cause** : Clés nulles ou noms invalides (résolu dans la version corrigée)
- **Solution** : Exécutez "🤖 Gestion CORRIGÉE des modèles"

## 🛡️ **Sécurité**

- **Droits restreints** sur les fichiers sensibles
- **Validation automatique** avant chaque opération critique
- **Sauvegardes automatiques** des configurations
- **Confirmation requise** pour les actions destructrices

## 📁 **Structure des Dossiers**

```
llama-runner-async-proxy/
├── logs/              # Fichiers de log
├── config/            # Fichiers de configuration
├── scripts/           # Scripts utilitaires
├── tests/             # Tests unitaires
├── documentation/     # Guides et manuels
└── models/            # (symbole) -> F:\llm\llama\models\
```

## 🔄 **Mises à Jour**

### Mise à Jour de la Configuration
```powershell
.\LaunchMenu.ps1
# Sélectionnez : "🔄 Mise à jour CORRIGÉE config"
```

### Mise à Jour des Dépendances
```powershell
.\LaunchMenu.ps1
# Sélectionnez : "📦 Installation des dépendances"
```

## 💡 **Conseils d'Utilisation**

1. **Utilisez toujours le menu interactif** comme point d'entrée
2. **Vérifiez les logs** en cas de problème (`logs/`)
3. **Gardez les modèles > 100MB** pour une détection fiable
4. **Redémarrez le proxy** après la configuration des modèles
5. **Utilisez le mode développement** pour le debugging (`--dev`)

---

**✅ Statut** : Système opérationnel et sécurisé
**🚀 Prêt à l'emploi** : Oui