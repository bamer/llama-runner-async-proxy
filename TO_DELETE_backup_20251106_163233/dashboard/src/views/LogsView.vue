<template>
  <div class="logs-view">
    <div class="logs-header">
      <h2>Logs Système</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshLogs">
          <el-icon><Refresh /></el-icon>
          Actualiser
        </el-button>
        <el-button @click="clearLogs">
          <el-icon><Delete /></el-icon>
          Effacer
        </el-button>
        <el-button @click="downloadLogs">
          <el-icon><Download /></el-icon>
          Télécharger
        </el-button>
      </div>
    </div>

    <!-- Log Filters -->
    <el-card class="filters-card" shadow="never">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="selectedLevel" placeholder="Niveau" clearable @change="applyFilters">
            <el-option label="DEBUG" value="debug" />
            <el-option label="INFO" value="info" />
            <el-option label="WARNING" value="warning" />
            <el-option label="ERROR" value="error" />
            <el-option label="CRITICAL" value="critical" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="selectedService" placeholder="Service" clearable @change="applyFilters">
            <el-option label="Llama Runner" value="llama-runner" />
            <el-option label="LM Studio Proxy" value="lmstudio" />
            <el-option label="Ollama Proxy" value="ollama" />
            <el-option label="Audio Service" value="audio" />
            <el-option label="Config Manager" value="config" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Rechercher dans les logs..."
            :prefix-icon="Search"
            clearable
            @input="applyFilters"
          />
        </el-col>
        <el-col :span="4">
          <el-switch 
            v-model="autoRefresh" 
            active-text="Auto"
            @change="toggleAutoRefresh"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- Logs Statistics -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ logStats.total }}</div>
              <div class="stat-label">Logs Total</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon errors">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ logStats.errors }}</div>
              <div class="stat-label">Erreurs</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon warnings">
              <el-icon><InfoFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ logStats.warnings }}</div>
              <div class="stat-label">Avertissements</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon last-update">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ logStats.lastUpdate }}</div>
              <div class="stat-label">Dernière MAJ</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Real-time Logs Display -->
    <el-card class="logs-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Logs Temps Réel</span>
          <div class="header-controls">
            <el-button-group>
              <el-button 
                size="small" 
                :type="viewMode === 'table' ? 'primary' : ''"
                @click="viewMode = 'table'"
              >
                <el-icon><List /></el-icon>
                Tableau
              </el-button>
              <el-button 
                size="small" 
                :type="viewMode === 'timeline' ? 'primary' : ''"
                @click="viewMode = 'timeline'"
              >
                <el-icon><Time /></el-icon>
                Timeline
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>
      
      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="logs-table-container">
        <el-table 
          :data="filteredLogs" 
          style="width: 100%"
          height="500"
          stripe
          :row-class-name="getRowClassName"
          @row-click="handleLogClick"
        >
          <el-table-column prop="timestamp" label="Timestamp" width="180">
            <template #default="scope">
              <span class="timestamp">{{ formatTimestamp(scope.row.timestamp) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="level" label="Niveau" width="100">
            <template #default="scope">
              <el-tag 
                :type="getLevelTagType(scope.row.level)" 
                size="small"
              >
                {{ scope.row.level.toUpperCase() }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="service" label="Service" width="150">
            <template #default="scope">
              <span class="service-name">{{ scope.row.service }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="message" label="Message">
            <template #default="scope">
              <div class="log-message">
                <span class="message-text">{{ scope.row.message }}</span>
                <span v-if="scope.row.details" class="details-toggle" @click.stop="toggleDetails(scope.row)">
                  <el-icon><InfoFilled /></el-icon>
                </span>
              </div>
              <div v-if="scope.row.showDetails" class="log-details">
                <pre>{{ scope.row.details }}</pre>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="Actions" width="100">
            <template #default="scope">
              <el-button 
                type="text" 
                size="small" 
                @click.stop="copyLog(scope.row)"
              >
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Timeline View -->
      <div v-else class="logs-timeline-container">
        <div class="timeline">
          <div 
            v-for="log in filteredLogs" 
            :key="log.id"
            class="timeline-item"
            :class="`timeline-${log.level}`"
            @click="handleLogClick(log)"
          >
            <div class="timeline-marker">
              <el-icon :class="getLevelIconClass(log.level)">
                <Warning v-if="log.level === 'error' || log.level === 'critical'" />
                <InfoFilled v-else-if="log.level === 'warning'" />
                <Document v-else />
              </el-icon>
            </div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-time">{{ formatTimestamp(log.timestamp) }}</span>
                <el-tag 
                  :type="getLevelTagType(log.level)" 
                  size="small"
                >
                  {{ log.level.toUpperCase() }}
                </el-tag>
                <span class="timeline-service">{{ log.service }}</span>
              </div>
              <div class="timeline-message">{{ log.message }}</div>
              <div v-if="log.details" class="timeline-details">
                <pre>{{ log.details }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Log Detail Modal -->
    <el-dialog 
      v-model="showLogDetail" 
      title="Détails du Log" 
      width="600px"
    >
      <div v-if="selectedLog" class="log-detail-content">
        <div class="detail-row">
          <label>Timestamp:</label>
          <span>{{ formatTimestamp(selectedLog.timestamp) }}</span>
        </div>
        <div class="detail-row">
          <label>Niveau:</label>
          <el-tag :type="getLevelTagType(selectedLog.level)">
            {{ selectedLog.level.toUpperCase() }}
          </el-tag>
        </div>
        <div class="detail-row">
          <label>Service:</label>
          <span>{{ selectedLog.service }}</span>
        </div>
        <div class="detail-row">
          <label>Message:</label>
          <p>{{ selectedLog.message }}</p>
        </div>
        <div v-if="selectedLog.details" class="detail-row">
          <label>Détails:</label>
          <pre class="log-pre">{{ selectedLog.details }}</pre>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showLogDetail = false">Fermer</el-button>
        <el-button type="primary" @click="copyLog(selectedLog)">
          <el-icon><DocumentCopy /></el-icon>
          Copier
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Refresh, 
  Delete, 
  Download, 
  Search, 
  Document, 
  Warning, 
  InfoFilled, 
  Clock,
  List,
  Time,
  DocumentCopy
} from '@element-plus/icons-vue'

// Reactive data
const selectedLevel = ref('')
const selectedService = ref('')
const searchQuery = ref('')
const autoRefresh = ref(true)
const viewMode = ref('table')
const showLogDetail = ref(false)
const selectedLog = ref(null)

// Logs data
const logs = ref([
  {
    id: 1,
    timestamp: '2025-11-06T14:30:25Z',
    level: 'info',
    service: 'llama-runner',
    message: 'Modèle Qwen3-1.7B-Q8_0 chargé avec succès',
    details: '{\n  "model": "Qwen3-1.7B-Q8_0",\n  "load_time": "2.34s",\n  "memory_usage": "4.2GB"\n}'
  },
  {
    id: 2,
    timestamp: '2025-11-06T14:28:12Z',
    level: 'warning',
    service: 'lmstudio',
    message: 'Connexion proxy lente détectée (500ms)',
    details: null
  },
  {
    id: 3,
    timestamp: '2025-11-06T14:25:45Z',
    level: 'error',
    service: 'audio',
    message: 'Erreur de traitement audio - timeout',
    details: 'Timeout after 30 seconds while processing audio file: input.wav\nError code: AUDIO_PROCESSING_TIMEOUT'
  },
  {
    id: 4,
    timestamp: '2025-11-06T14:20:33Z',
    level: 'info',
    service: 'config',
    message: 'Configuration rechargée avec succès',
    details: null
  },
  {
    id: 5,
    timestamp: '2025-11-06T14:15:22Z',
    level: 'debug',
    service: 'ollama',
    message: 'Requête de génération reçue',
    details: '{\n  "model": "qwen2.5:7b",\n  "prompt": "Hello world",\n  "stream": true\n}'
  }
])

// Computed properties
const filteredLogs = computed(() => {
  let filtered = logs.value

  if (selectedLevel.value) {
    filtered = filtered.filter(log => log.level === selectedLevel.value)
  }

  if (selectedService.value) {
    filtered = filtered.filter(log => log.service === selectedService.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log => 
      log.message.toLowerCase().includes(query) ||
      (log.details && log.details.toLowerCase().includes(query))
    )
  }

  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
})

const logStats = computed(() => {
  const total = logs.value.length
  const errors = logs.value.filter(log => log.level === 'error' || log.level === 'critical').length
  const warnings = logs.value.filter(log => log.level === 'warning').length
  const lastUpdate = logs.value.length > 0 ? formatTimestamp(logs.value[0].timestamp) : 'N/A'

  return { total, errors, warnings, lastUpdate }
})

// Methods
const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('fr-FR')
}

const getLevelTagType = (level) => {
  const types = {
    'debug': 'info',
    'info': 'success',
    'warning': 'warning',
    'error': 'danger',
    'critical': 'danger'
  }
  return types[level] || 'info'
}

const getLevelIconClass = (level) => {
  const classes = {
    'debug': 'icon-debug',
    'info': 'icon-info',
    'warning': 'icon-warning',
    'error': 'icon-error',
    'critical': 'icon-critical'
  }
  return classes[level] || 'icon-info'
}

const getRowClassName = ({ row }) => {
  return `log-row-${row.level}`
}

const applyFilters = () => {
  // Filters are applied automatically via computed property
}

const handleLogClick = (log) => {
  selectedLog.value = log
  showLogDetail.value = true
}

const toggleDetails = (log) => {
  log.showDetails = !log.showDetails
}

const copyLog = async (log) => {
  try {
    const logText = `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()} [${log.service}] ${log.message}${log.details ? '\n\n' + log.details : ''}`
    await navigator.clipboard.writeText(logText)
    ElMessage.success('Log copié dans le presse-papiers')
  } catch (error) {
    ElMessage.error('Erreur lors de la copie')
  }
}

const refreshLogs = () => {
  // Simulate log refresh
  console.log('Refreshing logs...')
}

const clearLogs = () => {
  ElMessageBox.confirm(
    'Voulez-vous vraiment effacer tous les logs ?',
    'Confirmer l\'effacement',
    {
      confirmButtonText: 'Effacer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  ).then(() => {
    logs.value = []
    ElMessage.success('Logs effacés')
  }).catch(() => {
    ElMessage.info('Annulé')
  })
}

const downloadLogs = () => {
  const logText = logs.value.map(log => 
    `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()} [${log.service}] ${log.message}${log.details ? '\n' + log.details : ''}`
  ).join('\n')
  
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `llama-runner-logs-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const toggleAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

let autoRefreshInterval

const startAutoRefresh = () => {
  autoRefreshInterval = setInterval(() => {
    // Simulate new log entries
    if (Math.random() > 0.7) {
      const levels = ['info', 'warning', 'error']
      const services = ['llama-runner', 'lmstudio', 'ollama', 'audio']
      const messages = [
        'Nouvelle connexion établie',
        'Traitement terminé avec succès',
        'Avertissement: utilisation mémoire élevée',
        'Erreur de réseau détectée',
        'Configuration mise à jour'
      ]
      
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        service: services[Math.floor(Math.random() * services.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        details: Math.random() > 0.8 ? 'Additional debug information here...' : null,
        showDetails: false
      }
      
      logs.value.unshift(newLog)
      
      // Keep only last 1000 logs
      if (logs.value.length > 1000) {
        logs.value = logs.value.slice(0, 1000)
      }
    }
  }, 3000)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
}

// Lifecycle
onMounted(() => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style lang="scss" scoped>
.logs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logs-header {
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

.filters-card {
  margin-bottom: 20px;
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

    &.total { background: linear-gradient(135deg, #667eea, #764ba2); }
    &.errors { background: linear-gradient(135deg, #f093fb, #f5576c); }
    &.warnings { background: linear-gradient(135deg, #ffecd2, #fcb69f); }
    &.last-update { background: linear-gradient(135deg, #4facfe, #00f2fe); }
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

.logs-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-table-container {
  height: 500px;
}

.timestamp {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #606266;
}

.service-name {
  font-weight: 500;
  color: #303133;
}

.log-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .message-text {
    flex: 1;
  }

  .details-toggle {
    cursor: pointer;
    color: #909399;
    transition: color 0.3s ease;

    &:hover {
      color: #409eff;
    }
  }
}

.log-details {
  margin-top: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #409eff;

  pre {
    margin: 0;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
    color: #606266;
    white-space: pre-wrap;
  }
}

.logs-timeline-container {
  height: 500px;
  overflow-y: auto;
  padding: 16px;
}

.timeline {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e4e7ed;
  }

  .timeline-item {
    position: relative;
    margin-bottom: 24px;
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateX(4px);
    }

    .timeline-marker {
      position: absolute;
      left: 12px;
      top: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;

      .el-icon {
        font-size: 10px;
        color: white;
      }
    }

    .timeline-content {
      margin-left: 48px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 3px solid #e4e7ed;

      .timeline-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .timeline-time {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          color: #606266;
        }

        .timeline-service {
          font-size: 12px;
          color: #909399;
        }
      }

      .timeline-message {
        color: #303133;
        margin-bottom: 8px;
      }

      .timeline-details {
        pre {
          margin: 0;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 11px;
          color: #606266;
          white-space: pre-wrap;
        }
      }
    }
  }
}

// Timeline level colors
.timeline-debug .timeline-marker { background: #909399; }
.timeline-info .timeline-marker { background: #67c23a; }
.timeline-warning .timeline-marker { background: #e6a23c; }
.timeline-error .timeline-marker { background: #f56c6c; }
.timeline-critical .timeline-marker { background: #f56c6c; }

.timeline-debug .timeline-content { border-left-color: #909399; }
.timeline-info .timeline-content { border-left-color: #67c23a; }
.timeline-warning .timeline-content { border-left-color: #e6a23c; }
.timeline-error .timeline-content { border-left-color: #f56c6c; }
.timeline-critical .timeline-content { border-left-color: #f56c6c; }

// Icon colors
.icon-debug { color: #909399; }
.icon-info { color: #67c23a; }
.icon-warning { color: #e6a23c; }
.icon-error { color: #f56c6c; }
.icon-critical { color: #f56c6c; }

// Log detail modal
.log-detail-content {
  .detail-row {
    display: flex;
    margin-bottom: 16px;
    align-items: flex-start;

    label {
      font-weight: 600;
      color: #303133;
      min-width: 100px;
      margin-right: 16px;
    }

    span, p {
      color: #606266;
    }

    .log-pre {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
      background: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      margin: 0;
      white-space: pre-wrap;
      color: #606266;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .logs-header {
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
  
  .timeline::before {
    left: 15px;
  }
  
  .timeline-item .timeline-marker {
    left: 7px;
    width: 12px;
    height: 12px;
  }
  
  .timeline-content {
    margin-left: 32px;
    padding: 8px;
  }
}
</style>