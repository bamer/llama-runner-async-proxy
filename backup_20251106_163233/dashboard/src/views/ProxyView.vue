<template>
  <div class="proxy-view">
    <div class="proxy-header">
      <h2>Gestion des Proxies</h2>
      <div class="header-actions">
        <el-button type="primary" @click="startAllProxies">
          <el-icon><VideoPlay /></el-icon>
          Démarrer Tout
        </el-button>
        <el-button @click="stopAllProxies">
          <el-icon><VideoPause /></el-icon>
          Arrêter Tout
        </el-button>
        <el-button @click="refreshProxyStatus">
          <el-icon><Refresh /></el-icon>
          Actualiser
        </el-button>
      </div>
    </div>

    <!-- Proxy Statistics -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon active">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ proxyStats.activeProxies }}</div>
              <div class="stat-label">Proxies Actifs</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon requests">
              <el-icon><Phone /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ proxyStats.totalRequests }}</div>
              <div class="stat-label">Requêtes Total</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon latency">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ proxyStats.avgLatency }}ms</div>
              <div class="stat-label">Latence Moyenne</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon uptime">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ proxyStats.totalUptime }}</div>
              <div class="stat-label">Uptime Total</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Proxy Services List -->
    <div class="proxy-grid">
      <!-- LM Studio Proxy -->
      <el-card class="proxy-card" shadow="hover">
        <template #header>
          <div class="proxy-header-card">
            <div class="proxy-info">
              <img src="https://img.icons8.com/color/32/labVIEW.png" class="proxy-icon">
              <div class="proxy-details">
                <h3>LM Studio Proxy</h3>
                <p>Compatible avec l'API OpenAI</p>
              </div>
            </div>
            <div class="proxy-status">
              <el-tag :type="lmStudioProxy.status === 'active' ? 'success' : 'info'" size="large">
                {{ lmStudioProxy.status === 'active' ? 'Actif' : 'Inactif' }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="proxy-content">
          <!-- Configuration -->
          <div class="config-section">
            <h4>Configuration</h4>
            <el-form :model="lmStudioProxy.config" label-width="100px">
              <el-form-item label="Port">
                <el-input-number 
                  v-model="lmStudioProxy.config.port" 
                  :min="1024" 
                  :max="65535" 
                  :disabled="lmStudioProxy.status === 'active'"
                />
              </el-form-item>
              
              <el-form-item label="API Key">
                <el-input 
                  v-model="lmStudioProxy.config.api_key" 
                  type="password" 
                  show-password
                  placeholder="Optionnel"
                />
              </el-form-item>
              
              <el-form-item label="CORS">
                <el-switch 
                  v-model="lmStudioProxy.config.cors_enabled"
                  :disabled="lmStudioProxy.status === 'active'"
                />
              </el-form-item>
              
              <el-form-item label="Authentification">
                <el-switch 
                  v-model="lmStudioProxy.config.auth_enabled"
                  :disabled="lmStudioProxy.status === 'active'"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- Actions -->
          <div class="actions-section">
            <el-button-group>
              <el-button 
                v-if="lmStudioProxy.status !== 'active'"
                type="success" 
                @click="startProxy('lmstudio')"
                :loading="isStartingProxy"
              >
                <el-icon><VideoPlay /></el-icon>
                Démarrer
              </el-button>
              <el-button 
                v-if="lmStudioProxy.status === 'active'"
                type="warning" 
                @click="stopProxy('lmstudio')"
                :loading="isStoppingProxy"
              >
                <el-icon><VideoPause /></el-icon>
                Arrêter
              </el-button>
              <el-button 
                type="primary" 
                @click="restartProxy('lmstudio')"
                :disabled="lmStudioProxy.status !== 'active'"
                :loading="isRestartingProxy"
              >
                <el-icon><Refresh /></el-icon>
                Redémarrer
              </el-button>
              <el-button @click="openProxyDocs('lmstudio')">
                <el-icon><Document /></el-icon>
                Documentation
              </el-button>
            </el-button-group>
          </div>

          <!-- Statistics -->
          <div class="stats-section" v-if="lmStudioProxy.status === 'active'">
            <h4>Statistiques</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ lmStudioProxy.stats.requests }}</div>
                <div class="stat-label">Requêtes</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ lmStudioProxy.stats.success_rate }}%</div>
                <div class="stat-label">Réussite</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ lmStudioProxy.stats.avg_latency }}ms</div>
                <div class="stat-label">Latence</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ lmStudioProxy.uptime }}</div>
                <div class="stat-label">Uptime</div>
              </div>
            </div>
          </div>

          <!-- Endpoints -->
          <div class="endpoints-section">
            <h4>Endpoints Disponibles</h4>
            <div class="endpoint-list">
              <div class="endpoint-item">
                <code>POST /v1/chat/completions</code>
                <el-tag size="small" type="success">Chat</el-tag>
              </div>
              <div class="endpoint-item">
                <code>POST /v1/completions</code>
                <el-tag size="small" type="success">Completions</el-tag>
              </div>
              <div class="endpoint-item">
                <code>POST /v1/embeddings</code>
                <el-tag size="small" type="success">Embeddings</el-tag>
              </div>
              <div class="endpoint-item">
                <code>POST /v1/audio/transcriptions</code>
                <el-tag size="small" type="warning">Audio</el-tag>
              </div>
              <div class="endpoint-item">
                <code>GET /v1/models</code>
                <el-tag size="small" type="info">Models</el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Ollama Proxy -->
      <el-card class="proxy-card" shadow="hover">
        <template #header>
          <div class="proxy-header-card">
            <div class="proxy-info">
              <img src="https://img.icons8.com/color/32/docker.png" class="proxy-icon">
              <div class="proxy-details">
                <h3>Ollama Proxy</h3>
                <p>API Ollama compatible</p>
              </div>
            </div>
            <div class="proxy-status">
              <el-tag :type="ollamaProxy.status === 'active' ? 'success' : 'info'" size="large">
                {{ ollamaProxy.status === 'active' ? 'Actif' : 'Inactif' }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="proxy-content">
          <!-- Configuration -->
          <div class="config-section">
            <h4>Configuration</h4>
            <el-form :model="ollamaProxy.config" label-width="100px">
              <el-form-item label="Port">
                <el-input-number 
                  v-model="ollamaProxy.config.port" 
                  :min="1024" 
                  :max="65535" 
                  :disabled="ollamaProxy.status === 'active'"
                />
              </el-form-item>
              
              <el-form-item label="URL Base">
                <el-input 
                  v-model="ollamaProxy.config.base_url" 
                  placeholder="http://localhost:11434"
                  :disabled="ollamaProxy.status === 'active'"
                />
              </el-form-item>
              
              <el-form-item label="Audio">
                <el-switch 
                  v-model="ollamaProxy.config.audio_enabled"
                  :disabled="ollamaProxy.status === 'active'"
                />
              </el-form-item>
              
              <el-form-item label="Tools">
                <el-switch 
                  v-model="ollamaProxy.config.tools_enabled"
                  :disabled="ollamaProxy.status === 'active'"
                />
              </el-form-item>
            </el-form>
          </div>

          <!-- Actions -->
          <div class="actions-section">
            <el-button-group>
              <el-button 
                v-if="ollamaProxy.status !== 'active'"
                type="success" 
                @click="startProxy('ollama')"
                :loading="isStartingProxy"
              >
                <el-icon><VideoPlay /></el-icon>
                Démarrer
              </el-button>
              <el-button 
                v-if="ollamaProxy.status === 'active'"
                type="warning" 
                @click="stopProxy('ollama')"
                :loading="isStoppingProxy"
              >
                <el-icon><VideoPause /></el-icon>
                Arrêter
              </el-button>
              <el-button 
                type="primary" 
                @click="restartProxy('ollama')"
                :disabled="ollamaProxy.status !== 'active'"
                :loading="isRestartingProxy"
              >
                <el-icon><Refresh /></el-icon>
                Redémarrer
              </el-button>
              <el-button @click="openProxyDocs('ollama')">
                <el-icon><Document /></el-icon>
                Documentation
              </el-button>
            </el-button-group>
          </div>

          <!-- Statistics -->
          <div class="stats-section" v-if="ollamaProxy.status === 'active'">
            <h4>Statistiques</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ ollamaProxy.stats.requests }}</div>
                <div class="stat-label">Requêtes</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ollamaProxy.stats.success_rate }}%</div>
                <div class="stat-label">Réussite</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ollamaProxy.stats.avg_latency }}ms</div>
                <div class="stat-label">Latence</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ ollamaProxy.uptime }}</div>
                <div class="stat-label">Uptime</div>
              </div>
            </div>
          </div>

          <!-- Endpoints -->
          <div class="endpoints-section">
            <h4>Endpoints Disponibles</h4>
            <div class="endpoint-list">
              <div class="endpoint-item">
                <code>POST /api/chat</code>
                <el-tag size="small" type="success">Chat</el-tag>
              </div>
              <div class="endpoint-item">
                <code>POST /api/generate</code>
                <el-tag size="small" type="success">Generate</el-tag>
              </div>
              <div class="endpoint-item">
                <code>GET /api/tags</code>
                <el-tag size="small" type="info">Models</el-tag>
              </div>
              <div class="endpoint-item">
                <code>POST /api/audio/transcriptions</code>
                <el-tag size="small" type="warning">Audio</el-tag>
              </div>
              <div class="endpoint-item">
                <code>POST /api/pull</code>
                <el-tag size="small" type="info">Pull</el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Real-time Request Monitor -->
    <el-card class="monitor-card" shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>Monitor de Requêtes Temps Réel</span>
          <el-button type="text" @click="clearMonitor">
            <el-icon><Delete /></el-icon>
            Effacer
          </el-button>
        </div>
      </template>
      
      <div class="monitor-content">
        <div class="request-list">
          <div 
            v-for="request in recentRequests" 
            :key="request.id"
            class="request-item"
            :class="`request-${request.status}`"
          >
            <div class="request-info">
              <div class="request-method">{{ request.method }}</div>
              <div class="request-endpoint">{{ request.endpoint }}</div>
              <div class="request-proxy">{{ request.proxy }}</div>
            </div>
            <div class="request-meta">
              <div class="request-time">{{ request.time }}</div>
              <div class="request-latency">{{ request.latency }}ms</div>
              <el-tag 
                :type="getRequestStatusType(request.status)" 
                size="small"
              >
                {{ request.status }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  VideoPlay, 
  VideoPause, 
  Refresh, 
  Connection, 
  Phone, 
  Timer, 
  Clock, 
  Document,
  Delete
} from '@element-plus/icons-vue'

// Reactive data
const isStartingProxy = ref(false)
const isStoppingProxy = ref(false)
const isRestartingProxy = ref(false)

// Proxy statistics
const proxyStats = ref({
  activeProxies: 2,
  totalRequests: 4587,
  avgLatency: 145,
  totalUptime: '12:34:56'
})

// Recent requests
const recentRequests = ref([
  {
    id: 1,
    method: 'POST',
    endpoint: '/v1/chat/completions',
    proxy: 'LM Studio',
    status: 'success',
    time: '14:30:25',
    latency: 156
  },
  {
    id: 2,
    method: 'POST',
    endpoint: '/api/chat',
    proxy: 'Ollama',
    status: 'success',
    time: '14:30:20',
    latency: 89
  },
  {
    id: 3,
    method: 'GET',
    endpoint: '/v1/models',
    proxy: 'LM Studio',
    status: 'success',
    time: '14:30:15',
    latency: 23
  },
  {
    id: 4,
    method: 'POST',
    endpoint: '/api/generate',
    proxy: 'Ollama',
    status: 'error',
    time: '14:30:10',
    latency: 500
  }
])

// LM Studio Proxy data
const lmStudioProxy = ref({
  id: 'lmstudio',
  name: 'LM Studio Proxy',
  status: 'active',
  uptime: '02:45:30',
  config: {
    port: 1234,
    api_key: null,
    cors_enabled: true,
    auth_enabled: false
  },
  stats: {
    requests: 1247,
    success_rate: 98.5,
    avg_latency: 156
  }
})

// Ollama Proxy data
const ollamaProxy = ref({
  id: 'ollama',
  name: 'Ollama Proxy',
  status: 'active',
  uptime: '01:23:45',
  config: {
    port: 11434,
    base_url: 'http://localhost:11434',
    audio_enabled: true,
    tools_enabled: true
  },
  stats: {
    requests: 892,
    success_rate: 96.8,
    avg_latency: 134
  }
})

// Methods
const getRequestStatusType = (status) => {
  const types = {
    'success': 'success',
    'error': 'danger',
    'pending': 'warning',
    'timeout': 'info'
  }
  return types[status] || 'info'
}

const startProxy = async (proxyId) => {
  const proxy = proxyId === 'lmstudio' ? lmStudioProxy : ollamaProxy
  
  if (proxyId === 'lmstudio') {
    isStartingProxy.value = true
  } else {
    isStartingProxy.value = true
  }
  
  try {
    // Simulate proxy start
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    proxy.value.status = 'active'
    proxy.value.uptime = '00:00:01'
    proxy.value.stats = {
      requests: 0,
      success_rate: 0,
      avg_latency: 0
    }
    
    ElMessage.success(`${proxy.value.name} démarré avec succès`)
  } catch (error) {
    ElMessage.error(`Erreur lors du démarrage de ${proxy.value.name}`)
  } finally {
    isStartingProxy.value = false
    isStoppingProxy.value = false
    isRestartingProxy.value = false
  }
}

const stopProxy = async (proxyId) => {
  const proxy = proxyId === 'lmstudio' ? lmStudioProxy : ollamaProxy
  
  if (proxyId === 'lmstudio') {
    isStoppingProxy.value = true
  } else {
    isStoppingProxy.value = true
  }
  
  try {
    // Simulate proxy stop
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    proxy.value.status = 'inactive'
    proxy.value.uptime = null
    
    ElMessage.success(`${proxy.value.name} arrêté avec succès`)
  } catch (error) {
    ElMessage.error(`Erreur lors de l'arrêt de ${proxy.value.name}`)
  } finally {
    isStartingProxy.value = false
    isStoppingProxy.value = false
    isRestartingProxy.value = false
  }
}

const restartProxy = async (proxyId) => {
  const proxy = proxyId === 'lmstudio' ? lmStudioProxy : ollamaProxy
  
  isRestartingProxy.value = true
  
  try {
    // Simulate proxy restart
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    proxy.value.status = 'active'
    proxy.value.uptime = '00:00:01'
    
    ElMessage.success(`${proxy.value.name} redémarré avec succès`)
  } catch (error) {
    ElMessage.error(`Erreur lors du redémarrage de ${proxy.value.name}`)
  } finally {
    isStartingProxy.value = false
    isStoppingProxy.value = false
    isRestartingProxy.value = false
  }
}

const startAllProxies = async () => {
  if (lmStudioProxy.value.status !== 'active') {
    await startProxy('lmstudio')
  }
  if (ollamaProxy.value.status !== 'active') {
    await startProxy('ollama')
  }
}

const stopAllProxies = async () => {
  if (lmStudioProxy.value.status === 'active') {
    await stopProxy('lmstudio')
  }
  if (ollamaProxy.value.status === 'active') {
    await stopProxy('ollama')
  }
}

const refreshProxyStatus = () => {
  // Refresh proxy status from API
  console.log('Refreshing proxy status...')
}

const openProxyDocs = (proxyId) => {
  const urls = {
    'lmstudio': 'https://platform.openai.com/docs/api-reference',
    'ollama': 'https://github.com/jmorganca/ollama/blob/main/docs/api.md'
  }
  
  window.open(urls[proxyId], '_blank')
}

const clearMonitor = () => {
  recentRequests.value = []
}

// Real-time request simulation
let requestSimulationInterval

onMounted(() => {
  requestSimulationInterval = setInterval(() => {
    // Simulate new requests
    const methods = ['GET', 'POST', 'PUT', 'DELETE']
    const endpoints = {
      'lmstudio': ['/v1/chat/completions', '/v1/completions', '/v1/embeddings', '/v1/models'],
      'ollama': ['/api/chat', '/api/generate', '/api/tags', '/api/pull']
    }
    
    const proxy = Math.random() > 0.5 ? 'LM Studio' : 'Ollama'
    const proxyId = proxy === 'LM Studio' ? 'lmstudio' : 'ollama'
    const method = methods[Math.floor(Math.random() * methods.length)]
    const endpointList = endpoints[proxyId]
    const endpoint = endpointList[Math.floor(Math.random() * endpointList.length)]
    const latency = Math.floor(Math.random() * 500) + 50
    const status = Math.random() > 0.1 ? 'success' : 'error'
    
    recentRequests.value.unshift({
      id: Date.now(),
      method,
      endpoint,
      proxy,
      status,
      time: new Date().toLocaleTimeString('fr-FR'),
      latency
    })
    
    // Keep only last 20 requests
    if (recentRequests.value.length > 20) {
      recentRequests.value = recentRequests.value.slice(0, 20)
    }
  }, 3000)
})

onUnmounted(() => {
  if (requestSimulationInterval) {
    clearInterval(requestSimulationInterval)
  }
})
</script>

<style lang="scss" scoped>
.proxy-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.proxy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: white;

    &.active { background: linear-gradient(135deg, #667eea, #764ba2); }
    &.requests { background: linear-gradient(135deg, #f093fb, #f5576c); }
    &.latency { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    &.uptime { background: linear-gradient(135deg, #43e97b, #38f9d7); }
  }

  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.proxy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.proxy-card {
  height: fit-content;
}

.proxy-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .proxy-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .proxy-icon {
      width: 32px;
      height: 32px;
    }

    .proxy-details {
      h3 {
        margin: 0;
        font-size: 16px;
        color: #303133;
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.proxy-content {
  .config-section,
  .actions-section,
  .stats-section,
  .endpoints-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #606266;
      font-weight: 600;
    }
  }

  .actions-section {
    .el-button-group {
      width: 100%;
      display: flex;

      .el-button {
        flex: 1;
      }
    }
  }

  .stats-section {
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      .stat-item {
        text-align: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .endpoints-section {
    .endpoint-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .endpoint-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #f5f7fa;
        border-radius: 4px;

        code {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
          color: #303133;
        }
      }
    }
  }
}

.monitor-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .monitor-content {
    max-height: 400px;
    overflow-y: auto;

    .request-list {
      .request-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: #f8f9fa;
        }

        &:last-child {
          border-bottom: none;
        }

        .request-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .request-method {
            font-weight: 600;
            color: #409eff;
            font-size: 12px;
            padding: 2px 6px;
            background: #ecf5ff;
            border-radius: 3px;
          }

          .request-endpoint {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            color: #303133;
          }

          .request-proxy {
            font-size: 12px;
            color: #909399;
          }
        }

        .request-meta {
          display: flex;
          align-items: center;
          gap: 12px;

          .request-time {
            font-size: 12px;
            color: #909399;
          }

          .request-latency {
            font-size: 12px;
            font-weight: 500;
            color: #606266;
          }
        }
      }
    }
  }
}

// Responsive design
@media (max-width: 1200px) {
  .proxy-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .proxy-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .stats-row .el-col {
    margin-bottom: 15px;
  }
  
  .proxy-header-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .stats-section .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .request-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 576px) {
  .stats-section .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .proxy-content {
    .actions-section .el-button-group {
      flex-direction: column;
    }
  }
}
</style>