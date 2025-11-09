// Metrics store for managing real-time system monitoring data
import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useMetricsStore = defineStore('metrics', () => {
  // Connection status
  const connectionStatus = ref('disconnected') // disconnected, connecting, connected, error
  
  // System metrics
  const systemMetrics = reactive({
    cpu: {
      usage: 0,
      cores: 0,
      temperature: null,
      frequency: 0
    },
    memory: {
      total: 0,
      available: 0,
      used: 0,
      percentage: 0,
      cached: 0,
      buffers: 0
    },
    disk: {
      total: 0,
      used: 0,
      free: 0,
      percentage: 0,
      readBytes: 0,
      writeBytes: 0
    },
    network: {
      bytesSent: 0,
      bytesRecv: 0,
      packetsSent: 0,
      packetsRecv: 0,
      errorsIn: 0,
      errorsOut: 0
    },
    processes: {
      total: 0,
      running: 0,
      sleeping: 0,
      cpuPercent: 0,
      memoryPercent: 0
    }
  })
  
  // Model metrics
  const modelMetrics = reactive({
    models: {},
    totalRequests: 0,
    totalTokens: 0,
    averageResponseTime: 0,
    errorRate: 0,
    activeModels: 0
  })
  
  // API metrics
  const apiMetrics = reactive({
    endpoints: {},
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    requestsPerMinute: 0,
    errorRate: 0
  })
  
  // Circuit breaker statistics
  const circuitBreakerStats = reactive({})
  
  // Health status
  const healthStatus = reactive({
    overall: 'unknown', // healthy, warning, critical, unknown
    components: {},
    lastCheck: null,
    uptime: 0
  })
  
  // Alerts
  const alerts = ref([])
  const maxAlerts = 100
  
  // Historical data for charts (last 100 data points)
  const historicalData = reactive({
    cpu: [],
    memory: [],
    disk: [],
    network: [],
    responseTime: [],
    errorRate: []
  })
  
  // Thresholds for alerts
  const thresholds = reactive({
    cpu: 80,        // % CPU usage
    memory: 85,     // % Memory usage
    disk: 90,       // % Disk usage
    responseTime: 5, // seconds
    errorRate: 5,    // % error rate
    temperature: 70  // CPU temperature in Celsius
  })
  
  // Update connection status
  function updateConnectionStatus(status) {
    connectionStatus.value = status
  }
  
  // Update system metrics
  function updateSystemMetrics(data) {
    try {
      // Update current metrics
      Object.assign(systemMetrics, data)
      
      // Add to historical data (keep last 100 points)
      if (data.cpu?.usage !== undefined) {
        historicalData.cpu.push({
          timestamp: Date.now(),
          value: data.cpu.usage
        })
        if (historicalData.cpu.length > 100) {
          historicalData.cpu.shift()
        }
      }
      
      if (data.memory?.percentage !== undefined) {
        historicalData.memory.push({
          timestamp: Date.now(),
          value: data.memory.percentage
        })
        if (historicalData.memory.length > 100) {
          historicalData.memory.shift()
        }
      }
      
      if (data.disk?.percentage !== undefined) {
        historicalData.disk.push({
          timestamp: Date.now(),
          value: data.disk.percentage
        })
        if (historicalData.disk.length > 100) {
          historicalData.disk.shift()
        }
      }
      
      if (data.network) {
        historicalData.network.push({
          timestamp: Date.now(),
          value: (data.network.bytesSent + data.network.bytesRecv) / 1024 / 1024 // MB
        })
        if (historicalData.network.length > 100) {
          historicalData.network.shift()
        }
      }
      
      // Check thresholds and generate alerts
      checkThresholds()
      
    } catch (error) {
      console.error('Error updating system metrics:', error)
    }
  }
  
  // Update model metrics
  function updateModelMetrics(data) {
    try {
      Object.assign(modelMetrics, data)
      
      // Update individual model metrics
      if (data.models) {
        modelMetrics.models = { ...data.models }
      }
      
      // Add to historical data
      if (data.averageResponseTime !== undefined) {
        historicalData.responseTime.push({
          timestamp: Date.now(),
          value: data.averageResponseTime
        })
        if (historicalData.responseTime.length > 100) {
          historicalData.responseTime.shift()
        }
      }
      
      if (data.errorRate !== undefined) {
        historicalData.errorRate.push({
          timestamp: Date.now(),
          value: data.errorRate
        })
        if (historicalData.errorRate.length > 100) {
          historicalData.errorRate.shift()
        }
      }
      
      checkThresholds()
      
    } catch (error) {
      console.error('Error updating model metrics:', error)
    }
  }
  
  // Update API metrics
  function updateApiMetrics(data) {
    try {
      Object.assign(apiMetrics, data)
      
      if (data.endpoints) {
        apiMetrics.endpoints = { ...data.endpoints }
      }
      
      checkThresholds()
      
    } catch (error) {
      console.error('Error updating API metrics:', error)
    }
  }
  
  // Update circuit breaker statistics
  function updateCircuitBreakerStats(data) {
    try {
      Object.assign(circuitBreakerStats, data)
    } catch (error) {
      console.error('Error updating circuit breaker stats:', error)
    }
  }
  
  // Update health status
  function updateHealthStatus(data) {
    try {
      Object.assign(healthStatus, data)
      
      if (data.overall === 'critical' || data.overall === 'warning') {
        addAlert({
          type: 'health',
          severity: data.overall,
          message: `System health is ${data.overall}`,
          timestamp: Date.now()
        })
      }
      
    } catch (error) {
      console.error('Error updating health status:', error)
    }
  }
  
  // Add alert
  function addAlert(alert) {
    alerts.value.unshift({
      id: Date.now() + Math.random(),
      ...alert
    })
    
    // Keep only the latest alerts
    if (alerts.value.length > maxAlerts) {
      alerts.value = alerts.value.slice(0, maxAlerts)
    }
  }
  
  // Remove alert
  function removeAlert(id) {
    const index = alerts.value.findIndex(alert => alert.id === id)
    if (index > -1) {
      alerts.value.splice(index, 1)
    }
  }
  
  // Clear all alerts
  function clearAlerts() {
    alerts.value = []
  }
  
  // Check thresholds and generate alerts
  function checkThresholds() {
    const now = Date.now()
    
    // CPU usage alert
    if (systemMetrics.cpu.usage > thresholds.cpu) {
      addAlert({
        type: 'threshold',
        severity: systemMetrics.cpu.usage > thresholds.cpu + 10 ? 'critical' : 'warning',
        message: `High CPU usage: ${systemMetrics.cpu.usage.toFixed(1)}%`,
        timestamp: now,
        metric: 'cpu'
      })
    }
    
    // Memory usage alert
    if (systemMetrics.memory.percentage > thresholds.memory) {
      addAlert({
        type: 'threshold',
        severity: systemMetrics.memory.percentage > thresholds.memory + 10 ? 'critical' : 'warning',
        message: `High memory usage: ${systemMetrics.memory.percentage.toFixed(1)}%`,
        timestamp: now,
        metric: 'memory'
      })
    }
    
    // Disk usage alert
    if (systemMetrics.disk.percentage > thresholds.disk) {
      addAlert({
        type: 'threshold',
        severity: systemMetrics.disk.percentage > thresholds.disk + 5 ? 'critical' : 'warning',
        message: `High disk usage: ${systemMetrics.disk.percentage.toFixed(1)}%`,
        timestamp: now,
        metric: 'disk'
      })
    }
    
    // Temperature alert
    if (systemMetrics.cpu.temperature && systemMetrics.cpu.temperature > thresholds.temperature) {
      addAlert({
        type: 'threshold',
        severity: systemMetrics.cpu.temperature > thresholds.temperature + 10 ? 'critical' : 'warning',
        message: `High CPU temperature: ${systemMetrics.cpu.temperature}°C`,
        timestamp: now,
        metric: 'temperature'
      })
    }
    
    // Response time alert
    if (modelMetrics.averageResponseTime > thresholds.responseTime) {
      addAlert({
        type: 'performance',
        severity: modelMetrics.averageResponseTime > thresholds.responseTime * 2 ? 'critical' : 'warning',
        message: `High response time: ${modelMetrics.averageResponseTime.toFixed(2)}s`,
        timestamp: now,
        metric: 'responseTime'
      })
    }
    
    // Error rate alert
    if (modelMetrics.errorRate > thresholds.errorRate) {
      addAlert({
        type: 'performance',
        severity: modelMetrics.errorRate > thresholds.errorRate * 2 ? 'critical' : 'warning',
        message: `High error rate: ${modelMetrics.errorRate.toFixed(1)}%`,
        timestamp: now,
        metric: 'errorRate'
      })
    }
  }
  
  // Update thresholds
  function updateThresholds(newThresholds) {
    Object.assign(thresholds, newThresholds)
  }
  
  // Get formatted system status
  function getSystemStatus() {
    const cpuStatus = systemMetrics.cpu.usage < thresholds.cpu ? 'good' : 
                     systemMetrics.cpu.usage < thresholds.cpu + 10 ? 'warning' : 'critical'
    
    const memoryStatus = systemMetrics.memory.percentage < thresholds.memory ? 'good' : 
                        systemMetrics.memory.percentage < thresholds.memory + 10 ? 'warning' : 'critical'
    
    const diskStatus = systemMetrics.disk.percentage < thresholds.disk ? 'good' : 
                      systemMetrics.disk.percentage < thresholds.disk + 5 ? 'warning' : 'critical'
    
    return {
      cpu: cpuStatus,
      memory: memoryStatus,
      disk: diskStatus,
      overall: [cpuStatus, memoryStatus, diskStatus].includes('critical') ? 'critical' :
               [cpuStatus, memoryStatus, diskStatus].includes('warning') ? 'warning' : 'good'
    }
  }
  
  // Reset historical data
  function resetHistoricalData() {
    Object.keys(historicalData).forEach(key => {
      historicalData[key] = []
    })
  }
  
  // Get data for charts
  function getChartData(metric, limit = 50) {
    const data = historicalData[metric] || []
    return data.slice(-limit)
  }
  
  return {
    // State
    connectionStatus,
    systemMetrics,
    modelMetrics,
    apiMetrics,
    circuitBreakerStats,
    healthStatus,
    alerts,
    thresholds,
    
    // Actions
    updateConnectionStatus,
    updateSystemMetrics,
    updateModelMetrics,
    updateApiMetrics,
    updateCircuitBreakerStats,
    updateHealthStatus,
    addAlert,
    removeAlert,
    clearAlerts,
    updateThresholds,
    resetHistoricalData,
    
    // Getters
    getSystemStatus,
    getChartData,
    
    // Computed values
    isConnected: () => connectionStatus.value === 'connected',
    hasAlerts: () => alerts.value.length > 0,
    criticalAlerts: () => alerts.value.filter(a => a.severity === 'critical'),
    warningAlerts: () => alerts.value.filter(a => a.severity === 'warning')
  }
})
