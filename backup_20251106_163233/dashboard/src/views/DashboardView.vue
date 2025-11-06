<template>
  <div class="dashboard-view">
    <!-- Header with quick stats -->
    <div class="dashboard-header">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon models">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ modelsStats.active }}/{{ modelsStats.total }}</div>
                <div class="stat-label">Modèles Actifs</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon audio">
                <el-icon><Microphone /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ audioStats.running }}</div>
                <div class="stat-label">Services Audio</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon proxy">
                <el-icon><Connection /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ proxyStats.active }}</div>
                <div class="stat-label">Proxies Actifs</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon performance">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ performanceStats.cpu }}%</div>
                <div class="stat-label">CPU Usage</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Main dashboard content -->
    <el-row :gutter="20" class="dashboard-content">
      <!-- Real-time performance chart -->
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>Performance en Temps Réel</span>
              <el-button type="primary" size="small" @click="refreshChart">
                <el-icon><Refresh /></el-icon>
                Actualiser
              </el-button>
            </div>
          </template>
          <div class="chart-container">
            <Line 
              :data="performanceChartData" 
              :options="chartOptions"
              :key="chartKey"
            />
          </div>
        </el-card>
      </el-col>
      
      <!-- System status -->
      <el-col :span="8">
        <el-card class="status-card" shadow="hover">
          <template #header>
            <span>Statut Système</span>
          </template>
          
          <div class="status-list">
            <div class="status-item">
              <div class="status-label">Llama Runner Service</div>
              <div class="status-value">
                <el-tag :type="systemStatus.llamaRunner ? 'success' : 'danger'">
                  {{ systemStatus.llamaRunner ? 'Actif' : 'Inactif' }}
                </el-tag>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-label">Proxy LM Studio</div>
              <div class="status-value">
                <el-tag :type="systemStatus.lmStudio ? 'success' : 'warning'">
                  {{ systemStatus.lmStudio ? 'Actif' : 'Inactif' }}
                </el-tag>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-label">Proxy Ollama</div>
              <div class="status-value">
                <el-tag :type="systemStatus.ollama ? 'success' : 'warning'">
                  {{ systemStatus.ollama ? 'Actif' : 'Inactif' }}
                </el-tag>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-label">Audio Service</div>
              <div class="status-value">
                <el-tag :type="systemStatus.audioService ? 'success' : 'warning'">
                  {{ systemStatus.audioService ? 'Actif' : 'Inactif' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- Quick actions -->
        <el-card class="actions-card" shadow="hover" style="margin-top: 20px;">
          <template #header>
            <span>Actions Rapides</span>
          </template>
          
          <div class="quick-actions">
            <el-button type="primary" @click="restartAllServices" :loading="isRestarting">
              <el-icon><Refresh /></el-icon>
              Redémarrer Tous
            </el-button>
            
            <el-button type="success" @click="openConfig">
              <el-icon><Setting /></el-icon>
              Configuration
            </el-button>
            
            <el-button type="info" @click="showLogs">
              <el-icon><Document /></el-icon>
              Voir Logs
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent activity -->
    <el-card class="activity-card" shadow="hover" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>Activité Récente</span>
          <el-button type="text" @click="clearActivity">
            <el-icon><Delete /></el-icon>
            Effacer
          </el-button>
        </div>
      </template>
      
      <div class="activity-list">
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivity"
            :key="activity.id"
            :timestamp="activity.timestamp"
            :type="getActivityType(activity.type)"
            :color="getActivityColor(activity.type)"
          >
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description">{{ activity.description }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale
} from 'chart.js'
import { 
  Cpu, 
  Microphone, 
  Connection, 
  TrendCharts, 
  Refresh, 
  Setting, 
  Document, 
  Delete 
} from '@element-plus/icons-vue'

// Register Chart.js components
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale
)

// Reactive data
const isRestarting = ref(false)
const chartKey = ref(0)

// Stats data
const modelsStats = ref({
  active: 3,
  total: 29
})

const audioStats = ref({
  running: 2
})

const proxyStats = ref({
  active: 2
})

const performanceStats = ref({
  cpu: 45,
  memory: 62,
  requests: 156
})

// Chart data
const performanceChartData = ref({
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
  datasets: [
    {
      label: 'CPU (%)',
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      data: [30, 35, 40, 45, 50, 45, 45],
      fill: true
    },
    {
      label: 'Mémoire (%)',
      borderColor: '#764ba2',
      backgroundColor: 'rgba(118, 75, 162, 0.1)',
      data: [50, 55, 60, 62, 65, 62, 62],
      fill: true
    },
    {
      label: 'Requêtes/min',
      borderColor: '#f093fb',
      backgroundColor: 'rgba(240, 147, 251, 0.1)',
      data: [80, 120, 100, 140, 180, 150, 156],
      fill: true
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
}

// System status
const systemStatus = ref({
  llamaRunner: true,
  lmStudio: true,
  ollama: true,
  audioService: true
})

// Recent activity
const recentActivity = ref([
  {
    id: 1,
    type: 'model_loaded',
    title: 'Modèle chargé',
    description: 'Qwen3-1.7B-Q8_0.gguf initialisé avec succès',
    timestamp: '2025-11-06 14:30:00'
  },
  {
    id: 2,
    type: 'proxy_restarted',
    title: 'Proxy redémarré',
    description: 'LM Studio proxy reconnecté sur port 1234',
    timestamp: '2025-11-06 14:25:00'
  },
  {
    id: 3,
    type: 'error',
    title: 'Erreur résolue',
    description: 'Service audio recovered après timeout',
    timestamp: '2025-11-06 14:20:00'
  }
])

// Methods
const refreshChart = () => {
  chartKey.value++
}

const restartAllServices = async () => {
  isRestarting.value = true
  try {
    // Simulate service restart
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update system status
    systemStatus.value = {
      llamaRunner: true,
      lmStudio: true,
      ollama: true,
      audioService: true
    }
    
    // Add activity log
    recentActivity.value.unshift({
      id: Date.now(),
      type: 'service_restart',
      title: 'Services redémarrés',
      description: 'Tous les services ont été redémarrés avec succès',
      timestamp: new Date().toLocaleString('fr-FR')
    })
  } finally {
    isRestarting.value = false
  }
}

const openConfig = () => {
  // Navigate to config page
  window.location.hash = '#/config'
}

const showLogs = () => {
  // Navigate to logs page
  window.location.hash = '#/logs'
}

const clearActivity = () => {
  recentActivity.value = []
}

const getActivityType = (type) => {
  const types = {
    'model_loaded': 'success',
    'proxy_restarted': 'primary',
    'error': 'danger',
    'service_restart': 'warning'
  }
  return types[type] || 'info'
}

const getActivityColor = (type) => {
  const colors = {
    'model_loaded': '#67c23a',
    'proxy_restarted': '#409eff',
    'error': '#f56c6c',
    'service_restart': '#e6a23c'
  }
  return colors[type] || '#909399'
}

// Lifecycle
let updateInterval

onMounted(() => {
  // Start real-time updates
  updateInterval = setInterval(() => {
    // Simulate real-time data updates
    performanceStats.value = {
      cpu: Math.floor(Math.random() * 20) + 40,
      memory: Math.floor(Math.random() * 20) + 55,
      requests: Math.floor(Math.random() * 100) + 120
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
.dashboard-view {
  padding: 0;
}

.dashboard-header {
  margin-bottom: 30px;
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

    &.models { background: linear-gradient(135deg, #667eea, #764ba2); }
    &.audio { background: linear-gradient(135deg, #f093fb, #f5576c); }
    &.proxy { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    &.performance { background: linear-gradient(135deg, #43e97b, #38f9d7); }
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

.dashboard-content {
  margin-bottom: 30px;
}

.chart-card,
.status-card,
.actions-card,
.activity-card {
  height: 100%;
}

.chart-container {
  height: 300px;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-list {
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .status-label {
      font-weight: 500;
      color: #303133;
    }
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .el-button {
    width: 100%;
    justify-content: flex-start;
  }
}

.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-content {
  .activity-title {
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }

  .activity-description {
    font-size: 14px;
    color: #909399;
  }
}

// Responsive design
@media (max-width: 768px) {
  .dashboard-header .el-col {
    margin-bottom: 15px;
  }
  
  .chart-container {
    height: 250px;
  }
}

@media (max-width: 576px) {
  .dashboard-content .el-col {
    margin-bottom: 20px;
  }
}
</style>