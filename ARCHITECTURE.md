# 🏗️ Architecture du Projet Llama Runner

## Vue d'ensemble

Le projet Llama Runner est structuré selon le principe de **séparation des préoccupations (Separation of Concerns)** avec une interface utilisateur moderne basée sur Vue.js.

## Composants principaux

### 1. Backend Python (`/llama_runner`)

- **Responsabilité** : Gestion des runners, proxies, modèles et services
- **Technologies** : Python 3, FastAPI, asyncio
- **Ports** : 8585 (API principale), 11434 (Ollama proxy), 1234 (LM Studio proxy)
- **Fonctionnalités** :
  - Gestion des runners llama.cpp
  - Proxies Ollama et LM Studio
  - Service de découverte et gestion des modèles
  - Validation et gestion de configuration

### 2. Dashboard Web (`/dashboard`)

- **Responsabilité** : Interface utilisateur moderne pour la gestion du système
- **Technologies** : Vue.js 3, Element Plus, Chart.js, Vite
- **Port** : 8080
- **Fonctionnalités** :
  - Dashboard temps réel avec métriques et graphiques
  - Gestion des modèles (ajout, suppression, configuration)
  - Contrôle des services et proxies
  - Interface de configuration graphique
  - Monitoring des performances
  - Journalisation système

### 3. Scripts utilitaires (`/scripts`)

- **Responsabilité** : Outils d'automatisation et de maintenance
- **Fonctionnalités** :
  - Validation du système
  - Gestion de la configuration
  - Maintenance des ports

## Communication entre composants

```
[Vue.js Dashboard] <---> [Backend Python] <---> [Llama.cpp Runners]
     (Port 8080)           (Port 8585)           (Ports dynamiques)
         |                       |                      |
         | HTTP/WS API          | API REST/WS          | Processus locaux
         |----------------------|----------------------|
```

## Flux d'interaction

1. **Lancement du système** :
   - Exécuter `LaunchMenu.ps1` pour démarrer le backend
   - Accéder à `http://localhost:8080` pour le dashboard

2. **Gestion via le dashboard** :
   - Configuration des modèles
   - Contrôle des services
   - Surveillance des performances
   - Journalisation

3. **Accès aux services** :
   - Ollama Proxy : `http://localhost:11434`
   - LM Studio Proxy : `http://localhost:1234`
   - Dashboard : `http://localhost:8080`

## Structure du projet

```
llama-runner-async-proxy/
├── llama_runner/          # Backend Python
│   ├── controllers/       # Contrôleurs API
│   ├── models/           # Modèles de données
│   ├── repositories/     # Accès aux données
│   ├── services/         # Services métier
│   └── ...               # Autres composants
├── dashboard/            # Interface Vue.js
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── views/       # Vues principales
│   │   └── ...          # Autres fichiers
├── scripts/              # Scripts utilitaires
├── config/               # Fichiers de configuration
├── logs/                 # Fichiers de journalisation
├── models/               # Modèles GGUF
└── main.py              # Point d'entrée principal
```

## Ports utilisés

| Port | Service | Description |
|------|---------|-------------|
| 8080 | Dashboard | Interface utilisateur Vue.js |
| 8585 | Backend API | API REST et WebSocket |
| 11434 | Ollama Proxy | Compatible avec clients Ollama |
| 1234 | LM Studio Proxy | Compatible avec clients LM Studio |
| 8035 | llama-server | Interface Web directe (optionnelle) |

## Mise à jour de configuration

- **Ancien système** : Configuration via menus PowerShell
- **Nouveau système** : Configuration via l'interface du dashboard
- **Avantages** :
  - Interface graphique intuitive
  - Validation en temps réel
  - Historique des modifications
  - Sauvegarde et restauration automatiques

## Composants obsolètes supprimés

- **Metrics Server** : Remplacé par le dashboard Vue.js
- **Menus de configuration PowerShell** : Déplacés vers le dashboard

## Développement

Pour le développement, exécutez :

1. Backend : `python main.py`
2. Dashboard : `cd dashboard && npm run dev`

Le dashboard utilise un proxy pour accéder aux API backend pendant le développement.
