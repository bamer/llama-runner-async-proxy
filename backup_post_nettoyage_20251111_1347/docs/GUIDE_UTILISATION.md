# 🚀 Guide d'utilisation - LlamaRunner Pro

## 📋 Vue d'ensemble

Le script `Launch-LlamaRunner.ps1` est le lanceur principal de LlamaRunner Pro. Il offre plusieurs modes de lancement avec une interface interactive intuitive et des options en ligne de commande.

---

## 🎮 Mode Interactif (Recommandé)

### Lancement sans paramètre

```powershell
.\Launch-LlamaRunner.ps1
```

Cela affiche un menu interactif avec les options suivantes :

1. **🏃‍♂️ Proxy uniquement** - Lance le proxy (LM Studio + Ollama)
2. **🌐 Proxy + Interface Web** - Lance le proxy avec l'interface web
3. **📊 Proxy + Web UI + Dashboard Métriques** - Mode complet avec monitoring
4. **🔧 Mode Développement** - Avec logs détaillés pour le debugging
5. **🖥️ Mode Headless** - Serveur sans interface graphique
6. **🧪 Lancer les tests** - Tests de validation du système
7. **📦 Installer les dépendances** - Installation/mise à jour Python
8. **❌ Quitter** - Sortie du programme

---

## ⚡ Lancement en ligne de commande

### Options principales

```powershell
# Installation des dépendances
.\Launch-LlamaRunner.ps1 -Install

# Lancement du proxy uniquement
.\Launch-LlamaRunner.ps1 -Proxy

# Proxy + interface web
.\Launch-LlamaRunner.ps1 -WebUI

# Mode complet avec dashboard métriques
.\Launch-LlamaRunner.ps1 -Metrics

# Mode développement avec logs détaillés
.\Launch-LlamaRunner.ps1 -Dev

# Mode headless (serveur sans GUI)
.\Launch-LlamaRunner.ps1 -Headless

# Tests de validation
.\Launch-LlamaRunner.ps1 -Test
```

### Options de configuration

```powershell
# Spécifier un fichier de configuration
.\Launch-LlamaRunner.ps1 -Proxy -Config "ma_config.json"

# Niveau de log personnalisé
.\Launch-LlamaRunner.ps1 -Proxy -LogLevel "DEBUG"

# Ports personnalisés
.\Launch-LlamaRunner.ps1 -Metrics -MetricsPort 8080 -LmStudioPort 1235

# Mode combine
.\Launch-LlamaRunner.ps1 -Metrics -Headless -LogLevel "WARNING"
```

---

## 📊 Modes de fonctionnement détaillés

### 1. Proxy uniquement (`-Proxy`)

- **LM Studio API** : <http://localhost:1234>
- **Ollama API** : <http://localhost:11434>
- **Usage** : Intégration avec IDEs et outils externes

### 2. Proxy + Interface Web (`-WebUI`)

- **Dashboard Web** : <http://localhost:8081>
- **LM Studio API** : <http://localhost:1234>
- **Ollama API** : <http://localhost:11434>
- **Usage** : Interface utilisateur graphique complète

### 3. Mode Complet (`-Metrics`)

- **Dashboard Métriques** : <http://localhost:8080> ⭐
- **Interface Web** : <http://localhost:8081>
- **LM Studio API** : <http://localhost:1234>
- **Ollama API** : <http://localhost:11434>
- **Usage** : Monitoring en temps réel + interface complète

### 4. Mode Développement (`-Dev`)

- Logs détaillés activés (niveau DEBUG)
- **LM Studio API** : <http://localhost:1234>
- **Ollama API** : <http://localhost:11434>
- **Usage** : Débogage et développement

### 5. Mode Headless (`-Headless`)

- Serveur sans interface graphique
- **LM Studio API** : <http://localhost:1234>
- **Ollama API** : <http://localhost:11434>
- **Usage** : Serveurs, Docker, CI/CD

---

## 📈 Dashboard de monitoring en temps réel

Le mode `-Metrics` active le dashboard de monitoring accessible sur **<http://localhost:8585>**

### Fonctionnalités du dashboard

- 📊 **Graphiques en temps réel** : CPU, mémoire, disque, réseau
- 🛡️ **Circuit Breaker Status** : État des protections de résilience
- 🚨 **Alertes automatiques** : Notifications de performance
- 📈 **Métriques des modèles** : Temps de réponse, taux d'erreur
- 📡 **Métriques API** : Endpoints, statistiques d'utilisation

---

## ⚙️ Configuration avancée

### Variables d'environnement supportées

- `LLAMA_RUNNER_CONFIG` : Fichier de configuration par défaut
- `LLAMA_RUNNER_LOG_LEVEL` : Niveau de log global
- `LLAMA_RUNNER_METRICS_PORT` : Port du dashboard (défaut: 8585)

### Fichiers de configuration

- `config.json` : Configuration principale
- `config_prefilled.json` : Configuration pré-remplie
- `config_prefilled_enhanced.jsonc` : Configuration avancée

---

## 🔧 Dépannage

### Problèmes courants

**1. Erreur "Python non trouvé"**

```powershell
.\Launch-LlamaRunner.ps1 -Install
```

**2. Modules manquants**

```powershell
# Réinstaller les dépendances
.\Launch-LlamaRunner.ps1 -Install
```

**3. Port déjà utilisé**

```powershell
# Utiliser des ports différents
.\Launch-LlamaRunner.ps1 -Metrics -MetricsPort 8080
```

**4. Problèmes de performance**

```powershell
# Mode développement pour diagnostic
.\Launch-LlamaRunner.ps1 -Dev
```

### Logs de diagnostic

- Logs dans la console en temps réel
- Niveau DEBUG pour développement
- Circuit breaker stats dans le dashboard

---

## 🎯 Cas d'usage recommandés

### Pour les développeurs

```powershell
# Mode développement avec logs
.\Launch-LlamaRunner.ps1 -Dev
```

### Pour la production (serveurs)

```powershell
# Mode headless avec monitoring
.\Launch-LlamaRunner.ps1 -Metrics -Headless
```

### Pour les tests

```powershell
# Tests de validation
.\Launch-LlamaRunner.ps1 -Test
```

### Pour l'utilisation quotidienne

```powershell
# Mode complet avec interface
.\Launch-LlamaRunner.ps1 -WebUI
```

---

## 💡 Tips et astuces

1. **Démarrage rapide** : Utilisez le mode interactif pour explorer les options
2. **Monitoring continu** : Le mode `-Metrics` offre le meilleur contrôle
3. **Développement** : Le mode `-Dev` facilite le débogage
4. **Production** : Combinez `-Metrics -Headless` pour un serveur robuste
5. **Tests** : Lancez `-Test` régulièrement pour valider le système

---

## 🔒 Sécurité et bonnes pratiques

- ⚡ **Ports** : Les ports par défaut (1234, 11434, 8585) sont sécurisés
- 🛡️ **Circuit Breaker** : Protection automatique contre les défaillances
- 📊 **Monitoring** : Surveillance continue des performances
- 🔐 **Local** : Toutes les données restent locales par défaut

Le script gère automatiquement l'arrêt propre de tous les services avec Ctrl+C.
