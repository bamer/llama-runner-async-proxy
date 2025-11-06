<template>
  <div class="audio-view">
    <div class="audio-header">
      <h2>Gestion Audio</h2>
      <div class="header-actions">
        <el-button type="primary" @click="startAllAudio">
          <el-icon><VideoPlay /></el-icon>
          Démarrer Tout
        </el-button>
        <el-button @click="stopAllAudio">
          <el-icon><VideoPause /></el-icon>
          Arrêter Tout
        </el-button>
        <el-button @click="refreshAudioStatus">
          <el-icon><Refresh /></el-icon>
          Actualiser
        </el-button>
      </div>
    </div>

    <!-- Audio Statistics -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon active">
              <el-icon><Microphone /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ audioStats.activeServices }}</div>
              <div class="stat-label">Services Actifs</div>
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
              <div class="stat-value">{{ audioStats.totalRequests }}</div>
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
              <div class="stat-value">{{ audioStats.avgLatency }}s</div>
              <div class="stat-label">Latence Moyenne</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon accuracy">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ audioStats.accuracy }}%</div>
              <div class="stat-label">Précision Moyenne</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Audio Services List -->
    <el-card class="services-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>Services Audio</span>
          <el-button type="primary" size="small" @click="showAddServiceDialog = true">
            <el-icon><Plus /></el-icon>
            Ajouter Service
          </el-button>
        </div>
      </template>
      
      <div class="services-list">
        <div 
          v-for="service in audioServices" 
          :key="service.id"
          class="service-item"
          :class="{ 'service-active': service.status === 'active' }"
        >
          <div class="service-header">
            <div class="service-info">
              <div class="service-name">
                <el-icon><Microphone /></el-icon>
                {{ service.name }}
                <el-tag 
                  :type="getStatusTagType(service.status)" 
                  size="small"
                  style="margin-left: 8px;"
                >
                  {{ getStatusLabel(service.status) }}
                </el-tag>
              </div>
              <div class="service-description">{{ service.description }}</div>
            </div>
            
            <div class="service-actions">
              <el-button-group>
                <el-button 
                  v-if="service.status !== 'active'"
                  type="success" 
                  size="small"
                  @click="startService(service)"
                >
                  <el-icon><VideoPlay /></el-icon>
                </el-button>
                <el-button 
                  v-if="service.status === 'active'"
                  type="warning" 
                  size="small"
                  @click="stopService(service)"
                >
                  <el-icon><VideoPause /></el-icon>
                </el-button>
                <el-button 
                  type="primary" 
                  size="small"
                  @click="editService(service)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  type="danger" 
                  size="small"
                  @click="deleteService(service)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </el-button-group>
            </div>
          </div>

          <div class="service-details">
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">Modèle:</span>
                  <span class="detail-value">{{ service.model }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">Device:</span>
                  <span class="detail-value">{{ service.parameters.device }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">Compute Type:</span>
                  <span class="detail-value">{{ service.parameters.compute_type }}</span>
                </div>
              </el-col>
            </el-row>
            
            <el-row :gutter="20" style="margin-top: 12px;">
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">Threads:</span>
                  <span class="detail-value">{{ service.parameters.threads }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">Langue:</span>
                  <span class="detail-value">{{ service.parameters.language || 'Auto' }}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <span class="detail-label">Uptime:</span>
                  <span class="detail-value">{{ service.uptime || '00:00:00' }}</span>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="service-stats" v-if="service.status === 'active'">
            <div class="stat-grid">
              <div class="stat-box">
                <div class="stat-number">{{ service.stats.requests }}</div>
                <div class="stat-label">Requêtes</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">{{ service.stats.success_rate }}%</div>
                <div class="stat-label">Réussite</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">{{ service.stats.avg_latency }}s</div>
                <div class="stat-label">Latence</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">{{ service.stats.accuracy }}%</div>
                <div class="stat-label">Précision</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Real-time Audio Activity -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="activity-card" shadow="hover">
          <template #header>
            <span>Activité Temps Réel</span>
          </template>
          
          <div class="activity-list">
            <div 
              v-for="activity in recentAudioActivity" 
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon">
                <el-icon v-if="activity.type === 'transcription'" color="#67c23a"><Microphone /></el-icon>
                <el-icon v-else-if="activity.type === 'translation'" color="#409eff"><Connection /></el-icon>
                <el-icon v-else color="#e6a23c"><Warning /></el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-meta">
                  <span class="activity-service">{{ activity.service }}</span>
                  <span class="activity-time">{{ activity.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="performance-card" shadow="hover">
          <template #header>
            <span>Performance Audio</span>
          </template>
          
          <div class="performance-metrics">
            <div class="metric-item">
              <div class="metric-label">CPU Usage</div>
              <div class="metric-value">
                <el-progress :percentage="performance.cpu" :color="getProgressColor(performance.cpu)" />
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">Memory Usage</div>
              <div class="metric-value">
                <el-progress :percentage="performance.memory" :color="getProgressColor(performance.memory)" />
              </div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">GPU Usage</div>
              <div class="metric-value">
                <el-progress :percentage="performance.gpu" :color="getProgressColor(performance.gpu)" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Add Service Dialog -->
    <el-dialog 
      v-model="showAddServiceDialog" 
      title="Ajouter Service Audio" 
      width="500px"
    >
      <el-form :model="newService" label-width="120px">
        <el-form-item label="Nom">
          <el-input v-model="newService.name" placeholder="ex: Whisper Tiny FR" />
        </el-form-item>
        
        <el-form-item label="Description">
          <el-input v-model="newService.description" placeholder="Description du service" />
        </el-form-item>
        
        <el-form-item label="Modèle">
          <el-select v-model="newService.model" placeholder="Sélectionner un modèle">
            <el-option label="tiny" value="tiny" />
            <el-option label="base" value="base" />
            <el-option label="small" value="small" />
            <el-option label="medium" value="medium" />
            <el-option label="large" value="large" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Device">
          <el-select v-model="newService.parameters.device">
            <el-option label="CPU" value="cpu" />
            <el-option label="CUDA" value="cuda" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Compute Type">
          <el-select v-model="newService.parameters.compute_type">
            <el-option label="int8" value="int8" />
            <el-option label="float16" value="float16" />
            <el-option label="float32" value="float32" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Threads">
          <el-input-number v-model="newService.parameters.threads" :min="1" :max="16" />
        </el-form-item>
        
        <el-form-item label="Langue">
          <el-select v-model="newService.parameters.language" clearable>
            <el-option label="Auto" value="" />
            <el-option label="Français" value="fr" />
            <el-option label="Anglais" value="en" />
            <el-option label="Espagnol" value="es" />
            <el-option label="Allemand" value="de" />
            <el-option label="Italien" value="it" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddServiceDialog = false">Annuler</el-button>
        <el-button type="primary" @click="addService">Ajouter</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  VideoPlay, 
  VideoPause, 
  Refresh, 
  Microphone, 
  Phone, 
  Timer, 
  TrendCharts,
  Plus,
  Edit,
  Delete,
  Connection,
  Warning
} from '@element-plus/icons-vue'

// Reactive data
const showAddServiceDialog = ref(false)

// Audio statistics
const audioStats = ref({
  activeServices: 2,
  totalRequests: 1247,
  avgLatency: 2.3,
  accuracy: 94.5
})

// Performance metrics
const performance = ref({
  cpu: 45,
  memory: 62,
  gpu: 78
})

// New service form
const newService = ref({
  name: '',
  description: '',
  model: 'tiny',
  parameters: {
    device: 'cpu',
    compute_type: 'int8',
    threads: 4,
    language: ''
  }
})

// Audio services data
const audioServices = ref([
  {
    id: 1,
    name: 'Whisper Tiny FR',
    description: 'Service de transcription français rapide',
    model: 'tiny',
    status: 'active',
    parameters: {
      device: 'cpu',
      compute_type: 'int8',
      threads: 4,
      language: 'fr'
    },
    uptime: '02:45:30',
    stats: {
      requests: 456,
      success_rate: 97.2,
      avg_latency: 1.8,
      accuracy: 95.1
    }
  },
  {
    id: 2,
    name: 'Whisper Base EN',
    description: 'Service de transcription anglaise haute précision',
    model: 'base',
    status: 'active',
    parameters: {
      device: 'cpu',
      compute_type: 'int8',
      threads: 6,
      language: 'en'
    },
    uptime: '01:12:45',
    stats: {
      requests: 234,
      success_rate: 98.5,
      avg_latency: 2.1,
      accuracy: 96.8
    }
  }
])

// Recent activity
const recentAudioActivity = ref([
  {
    id: 1,
    type: 'transcription',
    title: 'Transcription terminée',
    service: 'Whisper Tiny FR',
    time: '14:30:25'
  },
  {
    id: 2,
    type: 'translation',
    title: 'Traduction effectuée',
    service: 'Whisper Base EN',
    time: '14:28:12'
  },
  {
    id: 3,
    type: 'error',
    title: 'Erreur de traitement',
    service: 'Whisper Tiny FR',
    time: '14:25:45'
  }
])

// Methods
const getStatusTagType = (status) => {
  const types = {
    'active': 'success',
    'inactive': 'info',
    'loading': 'warning',
    'error': 'danger'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    'active': 'Actif',
    'inactive': 'Inactif',
    'loading': 'Chargement',
    'error': 'Erreur'
  }
  return labels[status] || 'Inconnu'
}

const getProgressColor = (percentage) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const startService = async (service) => {
  service.status = 'loading'
  // Simulate service start
  setTimeout(() => {
    service.status = 'active'
    service.uptime = '00:00:01'
    service.stats = {
      requests: 0,
      success_rate: 0,
      avg_latency: 0,
      accuracy: 0
    }
  }, 2000)
}

const stopService = async (service) => {
  service.status = 'inactive'
  service.uptime = null
}

const editService = (service) => {
  console.log('Editing service:', service)
  // Open edit dialog
}

const deleteService = async (service) => {
  ElMessageBox.confirm(
    `Êtes-vous sûr de vouloir supprimer le service "${service.name}" ?`,
    'Confirmer la suppression',
    {
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      type: 'warning',
    }
  ).then(() => {
    const index = audioServices.value.findIndex(s => s.id === service.id)
    if (index > -1) {
      audioServices.value.splice(index, 1)
    }
    ElMessage.success('Service supprimé avec succès')
  }).catch(() => {
    ElMessage.info('Suppression annulée')
  })
}

const startAllAudio = async () => {
  for (const service of audioServices.value) {
    if (service.status !== 'active') {
      await startService(service)
    }
  }
}

const stopAllAudio = async () => {
  for (const service of audioServices.value) {
    if (service.status === 'active') {
      await stopService(service)
    }
  }
}

const refreshAudioStatus = () => {
  // Refresh audio status from API
  console.log('Refreshing audio status...')
}

const addService = () => {
  audioServices.value.push({
    id: Date.now(),
    ...newService.value,
    status: 'inactive'
  })
  
  showAddServiceDialog.value = false
  newService.value = {
    name: '',
    description: '',
    model: 'tiny',
    parameters: {
      device: 'cpu',
      compute_type: 'int8',
      threads: 4,
      language: ''
    }
  }
  
  ElMessage.success('Service ajouté avec succès')
}

// Real-time updates
let updateInterval

onMounted(() => {
  updateInterval = setInterval(() => {
    // Update performance metrics
    performance.value = {
      cpu: Math.floor(Math.random() * 30) + 40,
      memory: Math.floor(Math.random() * 20) + 55,
      gpu: Math.floor(Math.random() * 25) + 65
    }
  }, 5000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style lang="scss" scoped>
.audio-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.audio-header {
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
    &.accuracy { background: linear-gradient(135deg, #43e97b, #38f9d7); }
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

.services-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.services-list {
  .service-item {
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }

    &.service-active {
      border-color: #67c23a;
      background-color: #f0f9ff;
    }
  }

  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .service-info {
      flex: 1;

      .service-name {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .service-description {
        font-size: 14px;
        color: #909399;
      }
    }
  }

  .service-details {
    margin-bottom: 16px;

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;

      .detail-label {
        font-size: 14px;
        color: #909399;
      }

      .detail-value {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
    }
  }

  .service-stats {
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 6px;

      .stat-box {
        text-align: center;

        .stat-number {
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
}

.activity-card,
.performance-card {
  height: 100%;
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;

  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .activity-icon {
      margin-top: 2px;
    }

    .activity-content {
      flex: 1;

      .activity-title {
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
      }

      .activity-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #909399;

        .activity-service {
          font-weight: 500;
        }
      }
    }
  }
}

.performance-metrics {
  .metric-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .metric-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }

    .metric-value {
      .el-progress {
        width: 100%;
      }
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .audio-header {
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
  
  .service-stats .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .service-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .service-stats .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>