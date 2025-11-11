import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAppStore = defineStore('app', () => {
  // State
  const isConnected = ref(false)
  const connectedModelsCount = ref(0)
  const systemStatus = ref({
    llamaRunner: false,
    lmStudio: false,
    ollama: false,
    audioService: false
  })
  
  // WebSocket connection
  let ws = null

  // Getters
  const isHealthy = computed(() => {
    return systemStatus.value.llamaRunner && 
           (systemStatus.value.lmStudio || systemStatus.value.ollama)
  })

  const activeServicesCount = computed(() => {
    return Object.values(systemStatus.value).filter(status => status).length
  })

  // Actions
  const initializeWebSocket = () => {
    try {
      ws = new WebSocket('ws://localhost:8585/ws')
      
      ws.onopen = () => {
        isConnected.value = true
        console.log('WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(data)
      }
      
      ws.onclose = () => {
        isConnected.value = false
        console.log('WebSocket disconnected')
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!isConnected.value) {
            initializeWebSocket()
          }
        }, 5000)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'status_update':
        systemStatus.value = { ...systemStatus.value, ...data.status }
        break
      case 'model_count_update':
        connectedModelsCount.value = data.count
        break
      case 'health_check':
        // Handle health check responses
        break
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Load system status
      const statusResponse = await axios.get('/api/status')
      systemStatus.value = statusResponse.data
      
      // Load models count
      const modelsResponse = await axios.get('/api/models/count')
      connectedModelsCount.value = modelsResponse.data.count
      
      // Load health status
      const healthResponse = await axios.get('/api/health')
      isConnected.value = healthResponse.data.healthy
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const restartService = async () => {
    try {
      await axios.post('/api/restart')
      console.log('Service restarted successfully')
      
      // Reload data after restart
      setTimeout(() => {
        loadDashboardData()
      }, 3000)
    } catch (error) {
      console.error('Failed to restart service:', error)
      console.error('Error during service restart')
    }
  }

  const quitApplication = () => {
    // Using standard browser confirm instead of ElMessageBox
    if (confirm('Voulez-vous vraiment quitter l\'application ?')) {
      // Send quit signal to main application
      axios.post('/api/quit').catch(() => {
        // Ignore errors when quitting
      })
      
      // Close WebSocket
      if (ws) {
        ws.close()
      }
      
      // Notify user
      console.log('Application en cours de fermeture...')
      
      // Close browser window after a delay
      setTimeout(() => {
        if (window.close) {
          window.close()
        }
      }, 1000)
    } else {
      console.log('Annulé')
    }
  }

  const healthCheck = async () => {
    try {
      const response = await axios.get('/api/health')
      return response.data.healthy
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  return {
    // State
    isConnected,
    connectedModelsCount,
    systemStatus,
    
    // Getters
    isHealthy,
    activeServicesCount,
    
    // Actions
    initializeWebSocket,
    loadDashboardData,
    restartService,
    quitApplication,
    healthCheck
  }
})