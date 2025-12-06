# Plan d'Architecture Dashboard State-of-the-Art

## 📊 Vue d'ensemble
Transformer le dashboard actuel (monolithique, sans temps réel, pas de config) en un système professionnel avec :
- ✅ Architecture modulaire et extensible
- ✅ Temps réel complet (WebSocket bidirectionnel)
- ✅ Graphiques animés haute performance
- ✅ Gestion complète de la configuration avec hot-reload
- ✅ Interface moderne et responsive
- ✅ Système d'alertes et notifications
- ✅ Multi-tenancy et permissions
- ✅ Logging et audit trail

---

## 🏗️ PHASE 1 : ARCHITECTURE GLOBALE

### 1.1 Structure des répertoires
```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── index.js
│   ├── App.jsx
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── NotificationCenter.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardMain.jsx
│   │   │   ├── MetricsGrid.jsx
│   │   │   ├── SystemMetrics.jsx
│   │   │   ├── AlertsPanel.jsx
│   │   │   └── QuickStats.jsx
│   │   ├── monitoring/
│   │   │   ├── RealtimeGraphs.jsx
│   │   │   ├── MemoryMonitor.jsx
│   │   │   ├── CPUMonitor.jsx
│   │   │   ├── NetworkMonitor.jsx
│   │   │   ├── GPUMonitor.jsx
│   │   │   └── HistoryChart.jsx
│   │   ├── models/
│   │   │   ├── ModelsList.jsx
│   │   │   ├── ModelCard.jsx
│   │   │   ├── ModelDetails.jsx
│   │   │   ├── ModelActions.jsx
│   │   │   └── ModelStats.jsx
│   │   ├── config/
│   │   │   ├── ConfigPanel.jsx
│   │   │   ├── PathConfig.jsx
│   │   │   ├── ProxyConfig.jsx
│   │   │   ├── AdvancedConfig.jsx
│   │   │   ├── ConfigPresets.jsx
│   │   │   └── ConfigValidator.jsx
│   │   ├── logs/
│   │   │   ├── LogsViewer.jsx
│   │   │   ├── LogFilter.jsx
│   │   │   └── LogExporter.jsx
│   │   └── settings/
│   │       ├── UserSettings.jsx
│   │       ├── SystemSettings.jsx
│   │       └── NotificationSettings.jsx
│   ├── hooks/
│   │   ├── useWebSocket.js
│   │   ├── useMetrics.js
│   │   ├── useLocalStorage.js
│   │   ├── useTheme.js
│   │   └── useConfig.js
│   ├── services/
│   │   ├── api.js (client HTTP)
│   │   ├── websocket.js (gestion WS)
│   │   ├── config.js (gestion config)
│   │   ├── storage.js (localStorage)
│   │   ├── notifications.js (système notification)
│   │   └── logger.js (client logging)
│   ├── context/
│   │   ├── MetricsContext.jsx
│   │   ├── ConfigContext.jsx
│   │   ├── AuthContext.jsx
│   │   └── NotificationContext.jsx
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── calculations.js
│   │   └── constants.js
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Monitoring.jsx
│   │   ├── Models.jsx
│   │   ├── Configuration.jsx
│   │   ├── Logs.jsx
│   │   ├── Settings.jsx
│   │   └── NotFound.jsx
│   └── __tests__/
│       ├── components/
│       ├── hooks/
│       └── services/

backend/
├── src/
│   ├── index.js
│   ├── server.js
│   ├── websocket-server.js (WebSocket bidirectionnel)
│   ├── config.js
│   ├── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimit.js
│   ├── routes/
│   │   ├── api.js
│   │   ├── models.js
│   │   ├── config.js
│   │   ├── monitoring.js
│   │   ├── logs.js
│   │   └── health.js
│   ├── services/
│   │   ├── MetricsService.js (collecte temps réel)
│   │   ├── ConfigService.js (hot-reload)
│   │   ├── ModelService.js
│   │   ├── LogService.js
│   │   ├── NotificationService.js
│   │   └── ProxyService.js
│   ├── monitors/
│   │   ├── SystemMonitor.js (CPU, RAM, etc)
│   │   ├── GpuMonitor.js
│   │   ├── NetworkMonitor.js
│   │   └── ProcessMonitor.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── helpers.js
│   └── __tests__/

config/
├── app_config.json (base config)
├── dashboard_config.json (nouveau - config dashboard)
├── models_config.json
├── presets/
│   ├── performance.json
│   ├── balanced.json
│   ├── power-saving.json
│   └── development.json
└── schemas/
    ├── app-schema.json (JSON Schema validation)
    ├── models-schema.json
    └── dashboard-schema.json
```

### 1.2 Stack technologique (Frontend)
```json
{
  "framework": "React 19+",
  "state": "Redux Toolkit / Zustand",
  "realtime": "Socket.io (meilleur que ws natif)",
  "charting": "Recharts / Victory (plus performant que Chart.js)",
  "ui": "Shadcn/ui + Tailwind CSS",
  "styling": "CSS Modules + Tailwind",
  "forms": "React Hook Form + Zod",
  "routing": "React Router v6",
  "testing": "Vitest + React Testing Library",
  "build": "Vite (plus rapide que Webpack)"
}
```

### 1.3 Stack technologique (Backend)
```json
{
  "framework": "Express.js",
  "realtime": "Socket.io + ws",
  "validation": "Zod / Joi",
  "metrics": "prom-client (Prometheus)",
  "logging": "Winston / Pino",
  "monitoring": "os / systeminformation",
  "config": "cosmiconfig",
  "testing": "Jest + Supertest",
  "orm": "Prisma (optionnel - si DB)"
}
```

---

## 🔌 PHASE 2 : SYSTÈME TEMPS RÉEL

### 2.1 Architecture WebSocket/Socket.io

**Backend - Channels bidirectionnels :**
```javascript
// Émettre les événements en continu
setInterval(() => {
  io.emit('metrics:update', {
    timestamp: Date.now(),
    cpu: { usage: 45, cores: [12, 34, 23, 45] },
    memory: { used: 8.5, total: 16, percent: 53 },
    gpu: { usage: 78, memory: 6.2 },
    disk: { used: 450, total: 1000, iops: 234 },
    network: { in: 1024, out: 2048 },
    processes: [{ pid: 1234, name: 'python', memory: 2.4, cpu: 15 }]
  });
}, 1000); // 1 second updates

// Models status
io.emit('models:status', {
  timestamp: Date.now(),
  models: {
    'llama-7b': { 
      status: 'running', 
      requestsPerSecond: 45,
      avgLatency: 234,
      errorRate: 0.01,
      throughput: 1024
    }
  }
});

// Logs en live
io.emit('logs:append', {
  timestamp: Date.now(),
  level: 'info',
  service: 'model-runner',
  message: 'Model inference completed'
});
```

**Frontend - Consumption :**
```javascript
// Real-time state management avec Redux/Zustand
const metricsSlice = {
  state: {
    currentMetrics: {},
    metricsHistory: [], // Array de 3600 points (1h @ 1 update/sec)
    alerts: [],
    connections: {}
  },
  subscribers: {
    'metrics:update': (payload) => {
      updateMetrics(payload);
      checkAlertThresholds(payload);
      updateCharts();
    },
    'models:status': (payload) => updateModelStatus(payload),
    'logs:append': (payload) => appendLog(payload)
  }
};
```

### 2.2 Métriques collectées en temps réel

```javascript
const MetricsToCollect = {
  system: {
    cpu: { percent, cores[], load, uptime },
    memory: { used, free, total, percent, swap },
    disk: { 
      volumes: [{ 
        path, used, total, percent, iops, 
        throughputRead, throughputWrite 
      }]
    },
    network: { 
      interfaces: [{ 
        name, ip, received, transmitted, 
        packetsReceived, packetsSent
      }]
    },
    processes: [{ 
      pid, name, cpu, memory, status, 
      uptime, command
    }]
  },
  proxies: {
    ollama: { 
      enabled, port, healthy, 
      requestCount, errorCount, 
      avgLatency, uptimeSecs
    },
    lmstudio: { 
      enabled, port, healthy, 
      requestCount, errorCount, 
      avgLatency, uptimeSecs
    }
  },
  models: {
    [modelName]: {
      status, // running | stopped | loading | error
      port, pid,
      startTime,
      requestsProcessed,
      requestsPerSecond,
      averageLatency,
      errorRate,
      throughputTokensPerSec,
      memoryUsed,
      gpuMemoryUsed,
      temperature,
      contextUsagePercent
    }
  },
  application: {
    uptime,
    totalRequestsHandled,
    totalErrorsEncountered,
    activeConnections,
    configLastModified,
    version
  }
};
```

### 2.3 Intervals de mise à jour intelligents
```javascript
// Adaptive update intervals basés sur la charge
UpdateIntervals = {
  high_load: {      // > 80% CPU
    metrics: 500,   // ms
    models: 1000,
    logs: 500
  },
  medium_load: {    // 40-80% CPU
    metrics: 1000,
    models: 2000,
    logs: 1000
  },
  low_load: {       // < 40% CPU
    metrics: 2000,
    models: 5000,
    logs: 2000
  }
};
```

---

## 📊 PHASE 3 : GRAPHIQUES TEMPS RÉEL

### 3.1 Graphiques implémentés

```javascript
GraphicsDashboard = {
  // Vue d'ensemble
  quickStats: {
    type: "gauge",
    metrics: ["cpu", "memory", "gpu", "network"],
    updateInterval: 1000
  },
  
  // Historiques (24h)
  cpuTrend: {
    type: "lineChart",
    dataPoints: 1440,  // 1 point par minute
    legend: ["Overall", "Core 0", "Core 1", ...],
    tooltipFormat: "HH:mm - X%"
  },
  
  memoryTrend: {
    type: "areaChart",
    stacked: true,
    series: ["Used", "Cached", "Free"],
    dataPoints: 1440
  },
  
  diskTrend: {
    type: "barChart",
    series: Object.keys(volumes),
    dataPoints: 720  // 1 point toutes les 2 minutes
  },
  
  networkTrend: {
    type: "areaChart",
    stacked: true,
    series: ["Incoming", "Outgoing"],
    dataPoints: 1440
  },
  
  // Modèles
  modelLatency: {
    type: "lineChart",
    models: ["model1", "model2", ...],
    dataPoints: 600  // 10 min
  },
  
  modelThroughput: {
    type: "barChart",
    animated: true,
    models: ["model1", "model2", ...],
    updateInterval: 1000
  },
  
  modelDistribution: {
    type: "pieChart",
    metric: "requests",
    animation: "auto"
  },
  
  // Proxies
  proxyHealth: {
    type: "heatmap",
    timeRange: "24h",
    services: ["ollama", "lmstudio"]
  }
};
```

### 3.2 Technologies graphiques
- **Recharts** : Performant, React-native, animations fluides
- **Victory** : Alternative, plus de contrôle
- **Three.js** : Pour visualisations 3D (optionnel)
- **D3.js** : Pour graphiques complexes custom

### 3.3 Optimisation des performances
```javascript
// Virtualization pour listes longues
<VirtualList
  items={processes}
  height={600}
  itemHeight={40}
  renderer={ProcessRow}
/>

// Memoization des graphiques
const MemoChart = React.memo(Chart, (prev, next) => {
  return JSON.stringify(prev.data) === JSON.stringify(next.data);
});

// Lazy loading des onglets
const Monitoring = lazy(() => import('./Monitoring'));
const Logs = lazy(() => import('./Logs'));

// Web Workers pour calculs lourds
const worker = new Worker('metrics-worker.js');
worker.postMessage({ data: rawMetrics });
worker.onmessage = (e) => setProcessedMetrics(e.data);
```

---

## ⚙️ PHASE 4 : GESTION CONFIGURATION

### 4.1 Configuration Structure (dashboard_config.json)

```json
{
  "version": "1.0.0",
  "metadata": {
    "lastModified": "2024-12-03T10:30:00Z",
    "modifiedBy": "admin",
    "autoSave": true
  },
  
  "paths": {
    "modelsDirectory": "/home/user/models",
    "logsDirectory": "/var/log/llama-runner",
    "configDirectory": "/etc/llama-runner",
    "cacheDirectory": "/tmp/llama-cache",
    "watchedDirectories": [
      {
        "path": "/home/user/models",
        "recursive": true,
        "extensions": [".gguf", ".safetensors", ".bin"]
      }
    ]
  },
  
  "proxies": {
    "ollama": {
      "enabled": true,
      "port": 11434,
      "host": "127.0.0.1",
      "timeout": 30000,
      "retries": 3,
      "healthCheckInterval": 5000
    },
    "lmstudio": {
      "enabled": true,
      "port": 1234,
      "host": "127.0.0.1",
      "apiKey": "sk-...",
      "timeout": 30000,
      "rateLimitPerMinute": 1000
    }
  },
  
  "monitoring": {
    "updateInterval": 1000,
    "metricsRetention": 3600000,  // 1h en ms
    "enableDetailedLogging": true,
    "enableGpuMonitoring": true,
    "enableNetworkMonitoring": true,
    "alertThresholds": {
      "cpuPercent": 85,
      "memoryPercent": 90,
      "diskPercent": 95,
      "gpuMemoryPercent": 95,
      "errorRatePercent": 5,
      "latencyMs": 5000
    }
  },
  
  "models": {
    "defaultParameters": {
      "temperature": 0.7,
      "topP": 0.95,
      "topK": 40,
      "contextSize": 2048,
      "maxTokens": 512,
      "repeatPenalty": 1.1
    },
    "resourceLimits": {
      "maxMemoryMb": 8000,
      "maxCpuPercent": 90,
      "maxTimeoutSeconds": 300
    }
  },
  
  "ui": {
    "theme": "dark",
    "refreshRateMs": 1000,
    "chartsHistoryMinutes": 60,
    "defaultDashboardTab": "overview",
    "sidebarCollapsed": false,
    "compactMode": false
  },
  
  "notifications": {
    "enabled": true,
    "channels": ["toast", "email", "slack"],
    "alertTypes": {
      "systemAlert": { enabled: true, channels: ["toast", "email"] },
      "modelFailure": { enabled: true, channels: ["toast", "email", "slack"] },
      "highResourceUsage": { enabled: true, channels: ["toast"] },
      "configChanged": { enabled: true, channels: ["toast"] }
    }
  },
  
  "logging": {
    "level": "info",  // debug | info | warn | error
    "format": "json",
    "maxFileSize": "10mb",
    "maxFiles": 10,
    "enableConsole": true
  }
}
```

### 4.2 Hot-Reload Configuration

```javascript
// Backend - ConfigService
class ConfigService {
  constructor() {
    this.config = loadConfig();
    this.watchers = new Map();
    this.subscribers = new Set();
    this.setupFileWatcher();
  }

  setupFileWatcher() {
    fs.watch(CONFIG_DIR, (eventType, filename) => {
      if (filename.endsWith('.json')) {
        // Valider avant rechargement
        const newConfig = this.validateConfig(loadRawConfig());
        
        // Merger avec config existante
        this.config = mergeDeep(this.config, newConfig);
        
        // Notifier tous les souscripteurs
        this.notifySubscribers({
          type: 'config:updated',
          changes: diffConfigs(this.config, newConfig),
          timestamp: Date.now()
        });
        
        // Emettre via WebSocket
        io.emit('config:changed', {
          updated: newConfig,
          affectedServices: this.getAffectedServices(newConfig)
        });
      }
    });
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event) {
    this.subscribers.forEach(cb => cb(event));
  }

  validate(config) {
    // Valider contre JSON Schema
    const validator = new Validator();
    const result = validator.validate(config, schema);
    
    if (!result.valid) {
      throw new Error(`Configuration invalid: ${result.errors}`);
    }
    return true;
  }
}

// Frontend - Hook
function useConfig() {
  const [config, setConfig] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState({});

  useEffect(() => {
    // Connexion WebSocket pour hot-reload
    socket.on('config:changed', (event) => {
      // Afficher notification
      showNotification({
        type: 'info',
        title: 'Configuration mise à jour',
        message: `Services affectés: ${event.affectedServices.join(', ')}`
      });
      
      // Recharger config
      fetchConfig();
    });

    return () => socket.off('config:changed');
  }, []);

  const saveConfig = async (newConfig) => {
    await api.post('/api/v1/config', newConfig);
    setUnsavedChanges({});
  };

  return { config, saveConfig, unsavedChanges };
}
```

### 4.3 Configuration UI Components

```jsx
// PathConfiguration.jsx - Gestion des chemins
<ConfigPanel>
  <PathSelector
    label="Models Directory"
    currentPath={config.paths.modelsDirectory}
    onChange={(path) => updateConfig({ paths: { modelsDirectory: path } })}
    fileSystemBrowser={true}
  />
  
  <WatchedDirectoriesManager
    directories={config.paths.watchedDirectories}
    onAdd={(dir) => addWatchedDirectory(dir)}
    onRemove={(dir) => removeWatchedDirectory(dir)}
  />
  
  <DirectoryPreview
    path={config.paths.modelsDirectory}
    showModels={true}
    showStats={true}
  />
</ConfigPanel>

// ProxyConfiguration.jsx - Proxies
<ConfigPanel>
  <ProxyConfig
    proxy="ollama"
    config={config.proxies.ollama}
    onChange={(cfg) => updateConfig({ proxies: { ollama: cfg } })}
  />
  
  <ProxyHealthCheck proxy="ollama" />
  
  <ProxyConfig
    proxy="lmstudio"
    config={config.proxies.lmstudio}
    onChange={(cfg) => updateConfig({ proxies: { lmstudio: cfg } })}
  />
</ConfigPanel>

// ModelDefaults.jsx - Paramètres par défaut
<ConfigPanel>
  <SliderInput
    label="Temperature"
    min={0} max={2} step={0.1}
    value={config.models.defaultParameters.temperature}
    onChange={(v) => updateConfig({ models: { defaultParameters: { temperature: v } } })}
  />
  
  <NumberInput label="Context Size" />
  <NumberInput label="Max Tokens" />
  
  <PresetSelector
    presets={['creative', 'balanced', 'precise']}
    onSelect={(preset) => applyPreset(preset)}
  />
</ConfigPanel>

// AlertThresholds.jsx - Seuils d'alerte
<ConfigPanel>
  <ThresholdEditor
    thresholds={config.monitoring.alertThresholds}
    onChange={(thresholds) => updateConfig({ monitoring: { alertThresholds: thresholds } })}
  />
</ConfigPanel>

// ConfigBackup.jsx - Backup/Restore
<ConfigPanel>
  <ConfigBackupManager
    onExport={() => exportConfig()}
    onImport={(file) => importConfig(file)}
    onRestore={(version) => restoreConfig(version)}
    versions={configVersions}
  />
</ConfigPanel>
```

---

## 🚨 PHASE 5 : SYSTÈME D'ALERTES

### 5.1 Types d'alertes

```javascript
const AlertTypes = {
  SYSTEM: {
    HIGH_CPU: { severity: 'warning', threshold: 85 },
    HIGH_MEMORY: { severity: 'warning', threshold: 90 },
    DISK_FULL: { severity: 'critical', threshold: 95 },
    GPU_MEMORY_FULL: { severity: 'warning', threshold: 95 },
    NETWORK_ISSUES: { severity: 'error' },
    DISK_IO_SLOW: { severity: 'warning' }
  },
  
  MODELS: {
    MODEL_CRASHED: { severity: 'critical' },
    HIGH_LATENCY: { severity: 'warning', threshold: 5000 },
    HIGH_ERROR_RATE: { severity: 'error', threshold: 5 },
    MODEL_NOT_RESPONDING: { severity: 'critical' },
    INFERENCE_TIMEOUT: { severity: 'error' }
  },
  
  PROXIES: {
    PROXY_DOWN: { severity: 'critical' },
    PROXY_UNHEALTHY: { severity: 'error' },
    RATE_LIMIT_EXCEEDED: { severity: 'warning' }
  },
  
  CONFIG: {
    INVALID_CONFIG: { severity: 'critical' },
    CONFIG_AUTO_LOADED: { severity: 'info' },
    CONFIG_VALIDATION_FAILED: { severity: 'error' }
  },
  
  APPLICATION: {
    STARTUP_ERROR: { severity: 'critical' },
    MEMORY_LEAK_DETECTED: { severity: 'error' },
    SERVICE_DEGRADATION: { severity: 'warning' }
  }
};
```

### 5.2 Frontend - Alerts Panel

```jsx
// AlertsPanel.jsx
export function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ severity: 'all', type: 'all' });

  useEffect(() => {
    socket.on('alert:new', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 100));
      showNotification(alert);
    });

    socket.on('alert:resolved', (alertId) => {
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, resolved: true } : a
      ));
    });
  }, []);

  const filteredAlerts = alerts.filter(a => 
    (filters.severity === 'all' || a.severity === filters.severity) &&
    (filters.type === 'all' || a.type === filters.type)
  );

  return (
    <div className="alerts-panel">
      <AlertFilters onChange={setFilters} />
      
      <div className="alerts-list">
        {filteredAlerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id)}
            onAcknowledge={() => acknowledgeAlert(alert.id)}
          />
        ))}
      </div>
      
      <AlertHistory />
    </div>
  );
}
```

---

## 📋 PHASE 6 : PAGES ET COMPOSANTS

### 6.1 Pages principales

```jsx
// Dashboard Page - Vue globale
<DashboardPage>
  <QuickStatsGrid /> {/* CPU, Memory, GPU, Network gauges */}
  <RecentAlerts />
  <SystemHealthOverview />
  <ModelStatusGrid />
  <RecentLogs limit={10} />
</DashboardPage>

// Monitoring Page - Graphiques détaillés
<MonitoringPage>
  <MonitoringTabs>
    <Tab label="System">
      <CPUMonitor />
      <MemoryMonitor />
      <DiskMonitor />
      <NetworkMonitor />
    </Tab>
    <Tab label="GPU">
      <GPUMonitor />
    </Tab>
    <Tab label="Processes">
      <ProcessMonitor />
    </Tab>
  </MonitoringTabs>
</MonitoringPage>

// Models Page - Gestion modèles
<ModelsPage>
  <ModelsList />
  <ModelDetails />
  <ModelActions />
  <ModelPerformance />
</ModelsPage>

// Configuration Page - Complète
<ConfigurationPage>
  <ConfigTabs>
    <Tab label="Paths">
      <PathConfiguration />
    </Tab>
    <Tab label="Proxies">
      <ProxyConfiguration />
    </Tab>
    <Tab label="Models">
      <ModelDefaults />
    </Tab>
    <Tab label="Monitoring">
      <MonitoringConfig />
    </Tab>
    <Tab label="Alerts">
      <AlertThresholds />
    </Tab>
    <Tab label="UI">
      <UISettings />
    </Tab>
    <Tab label="Backup">
      <ConfigBackup />
    </Tab>
  </ConfigTabs>
</ConfigurationPage>

// Logs Page - Viewer complet
<LogsPage>
  <LogFilters />
  <LogsViewer autoScroll={true} />
  <LogExport />
</LogsPage>

// Settings Page
<SettingsPage>
  <UserSettings />
  <NotificationSettings />
  <IntegrationSettings />
  <AdvancedSettings />
</SettingsPage>
```

### 6.2 Composants réutilisables

```javascript
// UI Components
- <Card /> - Container card
- <Badge /> - Labels
- <Button /> - Buttons variants
- <Tabs /> - Tabbed interface
- <Modal /> - Modal dialogs
- <Tooltip /> - Tooltips
- <Dropdown /> - Dropdowns
- <ProgressBar /> - Progress bars
- <Gauge /> - Radial gauges
- <Spinner /> - Loading spinner
- <Toast /> - Toast notifications
- <Alert /> - Alert boxes

// Data Components
- <DataTable /> - Virtualized table
- <LineChart /> - Historical data
- <AreaChart /> - Stacked areas
- <BarChart /> - Comparisons
- <PieChart /> - Distributions
- <HeatMap /> - Time heatmaps

// Specific Components
- <MetricCard /> - Display metric
- <ModelCard /> - Model preview
- <SystemMonitor /> - System metrics
- <ProcessMonitor /> - Process list
- <LogEntry /> - Single log
- <AlertCard /> - Alert notification
- <ConfigForm /> - Config editor
```

---

## 🔐 PHASE 7 : SÉCURITÉ ET PERMISSIONS

### 7.1 Authentication

```javascript
// Token-based auth
AuthContext = {
  user: { id, name, email, role },
  permissions: {
    'dashboard:view': true,
    'models:start': true,
    'models:stop': true,
    'config:edit': false,  // Read-only user
    'logs:export': false
  },
  
  endpoints: {
    'GET /api/v1/config': true,
    'POST /api/v1/config': false,
    'DELETE /api/v1/models/*': false
  }
};

// Protégé par JWT + Role-based access control
app.post('/api/v1/config', 
  authenticate,
  requirePermission('config:edit'),
  validateConfig,
  updateConfig
);
```

---

## 📝 PHASE 8 : LOGGING ET AUDIT

### 8.1 Backend Logging (Winston)

```javascript
const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console()
  ]
});

// Log events
logger.info('Model started', { modelName, port, timestamp });
logger.error('Model crashed', { modelName, error, exitCode });
logger.warn('High memory usage', { memoryPercent: 92 });
logger.debug('Config reloaded', { affectedServices: [...] });
```

### 8.2 Frontend Client Logging

```javascript
// Client-side logging service
const clientLogger = {
  info: (message, data) => {
    console.log(message, data);
    api.post('/api/v1/logs/client', { message, data, level: 'info' });
  },
  error: (message, error) => {
    console.error(message, error);
    api.post('/api/v1/logs/client', { message, error, level: 'error' });
  }
};
```

---

## 🧪 PHASE 9 : TESTING

### 9.1 Frontend Tests

```javascript
// Component tests
describe('MetricsGrid', () => {
  it('displays metrics correctly', () => {
    render(<MetricsGrid metrics={mockMetrics} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('updates in real-time', async () => {
    render(<MetricsGrid />);
    // Simuler WS update
    act(() => {
      socket.emit('metrics:update', newMetrics);
    });
    expect(screen.getByText('67%')).toBeInTheDocument();
  });
});

// Hook tests
describe('useMetrics', () => {
  it('connects to websocket and receives data', () => {
    const { result } = renderHook(() => useMetrics());
    expect(result.current.metrics).toBeDefined();
  });
});

// Integration tests
describe('Dashboard Integration', () => {
  it('loads and displays all widgets', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
    });
  });
});
```

### 9.2 Backend Tests

```javascript
// API tests
describe('GET /api/v1/monitoring', () => {
  it('returns valid metrics', async () => {
    const res = await request(app)
      .get('/api/v1/monitoring')
      .expect(200);
    
    expect(res.body).toHaveProperty('cpu');
    expect(res.body.cpu.percent).toBeDefined();
  });
});

// Service tests
describe('MetricsService', () => {
  it('collects CPU metrics', () => {
    const metrics = metricsService.getMetrics();
    expect(metrics.cpu.percent).toBeGreaterThanOrEqual(0);
  });
});
```

---

## 🚀 PHASE 10 : DÉPLOIEMENT ET PERFORMANCE

### 10.1 Build & Optimization

```bash
# Frontend
npm run build  # Vite build optimized
# Output: dist/ with code splitting, lazy loading, minified

# Backend
npm run build  # TypeScript compilation
npm start      # Production mode
```

### 10.2 Performance Targets

```
Frontend:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

Backend:
- Metrics endpoint: < 50ms
- WebSocket message latency: < 100ms
- Memory usage: < 200MB
- CPU: < 10% idle
```

### 10.3 Monitoring Production

```javascript
// Prometheus metrics
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const wsConnectionCount = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});
```

---

## 📦 DELIVERABLES

### Phase 1-2: Infrastructure (2-3 semaines)
- [ ] Réorganiser structure frontend/backend
- [ ] Implémenter Socket.io bidirectionnel
- [ ] Configurer Redux/Zustand pour state
- [ ] Mettre en place collecte métriques temps réel

### Phase 3: Graphiques (1-2 semaines)
- [ ] Intégrer Recharts
- [ ] Créer graphiques CPU, Memory, Network
- [ ] Implémenter animations fluides
- [ ] Optimiser rendering performance

### Phase 4: Configuration (2-3 semaines)
- [ ] Implémenter hot-reload config
- [ ] Path selector & model discovery
- [ ] Proxy configuration
- [ ] Preset system

### Phase 5-6: UI complète (2-3 semaines)
- [ ] Pages principales
- [ ] Composants réutilisables
- [ ] Responsive design
- [ ] Dark/Light themes

### Phase 7-9: Features avancées (1-2 semaines)
- [ ] Système d'alertes
- [ ] Auth & permissions
- [ ] Logging complet
- [ ] Tests

### Phase 10: Deployment (1 semaine)
- [ ] Build optimized
- [ ] Performance tuning
- [ ] Monitoring setup
- [ ] Documentation

---

## 💡 Quick Wins (Priorités immédiatement)

1. **Ajouter onglets** au dashboard (Monitoring, Models, Config, Logs)
2. **WebSocket bidirectionnel** avec Socket.io (remplace ws natif)
3. **Métriques temps réel** : CPU, Memory, Network live
4. **Configuration UI simple** pour Model paths
5. **Système notifications** toast basique
6. **Dark/Light theme** persistant
7. **Graphiques Recharts** CPU/Memory simples

---

## 🎯 Timeline recommandé

```
Week 1: Infrastructure + Socket.io + State management
Week 2: Graphiques temps réel
Week 3: Configuration system + hot-reload
Week 4: Pages complètes + composants
Week 5: Alertes + Auth
Week 6: Testing + Optimisation
Week 7: Deployment + Documentation
```

Total estimé: **4-7 semaines** pour production-ready

---

## 📚 Ressources recommandées

- Recharts docs: https://recharts.org
- Socket.io: https://socket.io/docs
- Zustand: https://github.com/pmndrs/zustand
- Shadcn/ui: https://ui.shadcn.com
- Tauri (optionnel desktop): https://tauri.app

