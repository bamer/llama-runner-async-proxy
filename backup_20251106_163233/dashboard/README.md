# 🚀 Llama Runner Dashboard - Modern Web Interface

**Version:** 1.0.0  
**Description:** Modern, responsive web dashboard for Llama Runner Async Proxy  
**Built with:** Vue.js 3 + Element Plus + Chart.js + Vite

---

## 🎨 Features

### ✨ **Interface Utilisateur Moderne**
- **Dashboard temps réel** avec métriques et graphiques
- **Gestion des modèles** intuitive avec recherche et filtres
- **Interface audio** pour la gestion des services de transcription
- **Contrôle des proxies** LM Studio et Ollama
- **Configuration graphique** avec validation en temps réel
- **Logs système** avec vue tableau et timeline
- **System Tray** web pour un accès rapide

### 🔥 **Fonctionnalités Avancées**
- **Hot Reload Configuration** - Zéro downtime
- **Gestion automatique des modèles** - Auto-discovery et lifecycle
- **Monitoring temps réel** - WebSocket + Server-Sent Events
- **Notifications système** - Browser + In-app
- **Responsive Design** - Desktop + Mobile
- **Thème sombre/clair** - CSS Variables

### 📊 **Dashboard Analytics**
- Métriques de performance en temps réel
- Statistiques des modèles et services
- Graphiques de performance avec Chart.js
- Monitoring des proxies et API
- Historique des activités

---

## 🛠️ Installation & Setup

### Prerequisites
```bash
# Node.js 16+ et npm/pnpm
node --version  # v16+
npm --version
```

### Installation Rapide
```bash
# Cloner le projet (si pas déjà fait)
cd llama-runner-async-proxy

# Installer les dépendances
cd dashboard
npm install
# ou
pnpm install

# Lancer en mode développement
npm run dev
# ou
pnpm dev
```

### Build pour Production
```bash
# Créer le build de production
npm run build
# ou  
pnpm build

# Prévisualiser le build
npm run preview
# ou
pnpm preview
```

---

## 📁 Structure du Projet

```
dashboard/
├── public/                 # Fichiers statiques
├── src/
│   ├── components/        # Composants Vue réutilisables
│   ├── views/            # Vues principales
│   │   ├── DashboardView.vue
│   │   ├── ModelsView.vue
│   │   ├── AudioView.vue
│   │   ├── ProxyView.vue
│   │   ├── ConfigView.vue
│   │   └── LogsView.vue
│   ├── stores/           # Pinia stores
│   ├── router/           # Configuration Vue Router
│   ├── hot-reload/       # Système Hot Reload
│   ├── model-manager/    # Gestion automatique modèles
│   ├── system-tray/      # Interface System Tray
│   ├── utils/           # Utilitaires
│   └── style/           # Styles SCSS globaux
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Utilisation

### Lancement du Dashboard
```bash
# Mode développement (avec hot reload)
npm run dev

# Production build
npm run build && npm run preview

# Le dashboard sera disponible sur http://localhost:8080
```

### Configuration API Backend
Le dashboard communicates avec le backend via les endpoints suivants :
- `GET /api/status` - Status système
- `GET /api/models` - Liste des modèles
- `GET /api/config/*` - Configuration
- `WebSocket /ws` - Updates temps réel

### Variables d'Environnement
Créer `.env.local` :
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
VITE_APP_TITLE="Llama Runner Dashboard"
VITE_APP_VERSION="1.0.0"
```

---

## 🎯 Fonctionnalités Détaillées

### 1. **Dashboard Principal**
- Vue d'ensemble système en temps réel
- Métriques de performance (CPU, mémoire, requêtes)
- Statut des services (Llama Runner, Proxies, Audio)
- Graphiques de performance interactifs
- Actions rapides (restart, config, logs)

### 2. **Gestion des Modèles**
- Liste complète des modèles avec recherche/filtre
- Actions : Démarrer, arrêter, redémarrer, éditer, supprimer
- Statistiques détaillées par modèle (uptime, requêtes, latence)
- Formulaire d'ajout avec validation
- Métadonnées et paramètres configurables

### 3. **Interface Audio**
- Gestion des services Whisper/Faster-Whisper
- Statistiques en temps réel (requêtes, précision, latence)
- Configuration des paramètres audio
- Monitoring des performances système

### 4. **Contrôle des Proxies**
- Interface pour LM Studio et Ollama proxies
- Configuration des ports et paramètres
- Statistiques de requêtes en temps réel
- Documentation intégrée des APIs
- Monitor de requêtes live

### 5. **Configuration Graphique**
- Interface tabulaire pour tous les paramètres
- Validation en temps réel
- Hot reload sans redémarrage
- Historique des changements
- Backup/restore automatique

### 6. **Logs Système**
- Vue tableau et timeline
- Filtrage par niveau, service, recherche
- Notifications automatiques
- Export des logs
- Streaming temps réel

### 7. **System Tray Web**
- Accès rapide depuis n'importe quelle page
- Statut système en temps réel
- Actions rapides
- Notifications
- Mode compact/étendu

---

## ⚡ Hot Reload Configuration

### Fonctionnalités
- **Détection automatique** des changements de config
- **Validation** avant application
- **Backup automatique** avant changements
- **Rollback** en cas d'erreur
- **Notifications** des changements
- **Queue** des changements multiples

### Configuration
```javascript
// Dans hot-reload/HotReloadConfig.js
const hotReload = new HotReloadConfig({
  watchInterval: 1000,        // Vérification chaque seconde
  debounceDelay: 500,         // Debounce des changements
  autoBackup: true,           // Backup automatique
  maxBackups: 10,             // Nombre max de backups
  validationEnabled: true,    // Validation avant application
  rollbackOnError: true,      // Rollback automatique
  notifyChanges: true         // Notifications
})
```

---

## 🤖 Gestion Automatique des Modèles

### Capacités
- **Auto-discovery** des nouveaux modèles
- **Lifecycle management** (load/unload)
- **Health monitoring** des modèles
- **Performance tracking**
- **Auto-cleanup** basé sur l'usage
- **Recommandations** intelligentes

### Algorithmes
- **Priorité** calculée basée sur taille, format, usage
- **Auto-load** des modèles appropriés
- **Cleanup** automatique basé sur mémoire et usage
- **Health checks** périodiques
- **Performance monitoring** avec alertes

---

## 📱 Responsive Design

### Breakpoints
- **Desktop**: > 1200px - Interface complète
- **Tablet**: 768px - 1200px - Layout adaptatif
- **Mobile**: < 768px - Interface optimisée

### Adaptations
- Navigation collapsible
- Grids responsives
- Tables scrollables
- Touch-friendly interactions
- Optimisations performance mobile

---

## 🎨 Thème & Styling

### CSS Variables
```scss
:root {
  --primary-color: #667eea;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  // ... plus de variables
}
```

### Thème Sombre
Support automatique via `data-theme="dark"`

---

## 🔧 Configuration Avancée

### Vite Configuration
```javascript
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://localhost:8585',
      '/socket.io': {
        target: 'http://localhost:8585',
        ws: true
      }
    }
  }
})
```

### Pinia Store
```javascript
// stores/app.js
export const useAppStore = defineStore('app', () => {
  // State, getters, actions
})
```

---

## 🚦 API Endpoints Requis

### Status & Health
- `GET /api/status` - Status système
- `GET /api/health` - Health check
- `GET /api/models/count` - Compteur modèles

### Models
- `GET /api/models` - Liste complète
- `POST /api/models/{id}/load` - Charger modèle
- `POST /api/models/{id}/unload` - Décharger modèle
- `GET /api/models/{id}/health` - Health check modèle

### Configuration
- `GET /api/config/current` - Config actuelle
- `POST /api/config/validate` - Validation config
- `GET /api/config/last-modified` - Timestamp modification
- `POST /api/config/backup` - Créer backup

### Real-time
- `WebSocket /ws` - Updates temps réel
- `EventSource /api/config/events` - Configuration events

---

## 🔒 Sécurité

### Headers CORS
```javascript
// Configuration backend requise
Access-Control-Allow-Origin: http://localhost:8080
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Authentification (Optionnel)
```javascript
// Token-based auth
const token = localStorage.getItem('auth_token')
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

---

## 📊 Performance

### Optimisations
- **Lazy loading** des routes
- **Code splitting** automatique
- **Tree shaking** des dépendances
- **Asset optimization** (images, fonts)
- **Caching** intelligent

### Métriques Cibles
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB gzipped
- **Memory Usage**: < 50MB

---

## 🧪 Tests

### Commandes
```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:coverage
```

### Structure Tests
```
tests/
├── unit/           # Tests unitaires
├── e2e/           # Tests end-to-end
└── fixtures/      # Données de test
```

---

## 🚀 Déploiement

### Docker (Optionnel)
```dockerfile
# Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8585;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐛 Troubleshooting

### Problèmes Communs

#### Dashboard ne se charge pas
```bash
# Vérifier les ports
netstat -an | grep 8080

# Vérifier les logs
npm run dev -- --debug
```

#### API Calls échouent
```javascript
// Vérifier la configuration proxy dans vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8585',
    changeOrigin: true
  }
}
```

#### WebSocket ne fonctionne pas
```javascript
// Vérifier la configuration CORS côté backend
Access-Control-Allow-Origin: http://localhost:8080
Access-Control-Allow-Headers: Content-Type
```

---

## 📚 Documentation API

### Endpoints Détaillés
Voir `/api/docs` pour la documentation Swagger complète

### Exemples d'Usage
```javascript
// Charger un modèle
await axios.post('/api/models/qwen-7b/load', {
  parameters: { temperature: 0.7 }
})

// Obtenir le status
const status = await axios.get('/api/status')
console.log(status.data)

// Écouter les updates WebSocket
const ws = new WebSocket('ws://localhost:8585/ws')
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Update:', data)
}
```

---

## 🤝 Contribution

### Guidelines
1. **Code Style**: ESLint + Prettier
2. **Commits**: Conventional Commits
3. **Tests**: > 80% coverage
4. **Documentation**: JSDoc + README updates

### Setup Dev
```bash
git clone <repo>
cd dashboard
npm install
npm run dev
```

---

## 📄 License

MIT License - Voir [LICENSE](../../LICENSE) pour plus de détails.

---

## 🆘 Support

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Documentation**: [Wiki](../../wiki)
- **Discord**: [Serveur Community](https://discord.gg/...)

---

*Dashboard créé avec ❤️ pour la communauté Llama Runner*