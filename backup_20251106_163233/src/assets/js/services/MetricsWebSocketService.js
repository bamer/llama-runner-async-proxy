// WebSocket service for real-time metrics streaming
import { useMetricsStore } from '../stores/metrics.js'

class MetricsWebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 5000
    this.isConnecting = false
    this.messageQueue = []
    this.circuitBreaker = {
      state: 'closed', // closed, open, half-open
      failureCount: 0,
      failureThreshold: 5,
      recoveryTimeout: 30000,
      lastFailureTime: null
    }
    
    this.metricsStore = useMetricsStore()
  }

  // Circuit breaker pattern for WebSocket connection management
  canAttemptConnection() {
    if (this.circuitBreaker.state === 'closed') return true
    if (this.circuitBreaker.state === 'half-open') return true
    
    if (this.circuitBreaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime
      if (timeSinceLastFailure >= this.circuitBreaker.recoveryTimeout) {
        this.circuitBreaker.state = 'half-open'
        this.circuitBreaker.failureCount = 0
        return true
      }
      return false
    }
    
    return false
  }

  recordConnectionSuccess() {
    this.circuitBreaker.failureCount = 0
    if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.state = 'closed'
    }
  }

  recordConnectionFailure() {
    this.circuitBreaker.failureCount++
    this.circuitBreaker.lastFailureTime = Date.now()
    
    if (this.circuitBreaker.failureCount >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'open'
    }
  }

  getCircuitBreakerStats() {
    return {
      ...this.circuitBreaker,
      timeSinceLastFailure: this.circuitBreaker.lastFailureTime ? 
        Date.now() - this.circuitBreaker.lastFailureTime : null
    }
  }

  async connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    if (!this.canAttemptConnection()) {
      console.warn('Circuit breaker is open, cannot connect to metrics WebSocket')
      return
    }

    this.isConnecting = true

    try {
      // Use localhost for local development
      const wsUrl = `ws://localhost:8080/metrics`
      
      console.log('Connecting to metrics WebSocket...')
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('Metrics WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.recordConnectionSuccess()
        
        // Process any queued messages
        this.processMessageQueue()
        
        // Update store connection status
        this.metricsStore.updateConnectionStatus('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMetricsMessage(data)
        } catch (error) {
          console.error('Error parsing metrics message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('Metrics WebSocket closed:', event.code, event.reason)
        this.isConnecting = false
        this.ws = null
        
        // Record failure for circuit breaker
        this.recordConnectionFailure()
        
        // Update store connection status
        this.metricsStore.updateConnectionStatus('disconnected')
        
        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('Metrics WebSocket error:', error)
        this.isConnecting = false
        
        // Record failure for circuit breaker
        this.recordConnectionFailure()
        
        // Update store connection status
        this.metricsStore.updateConnectionStatus('error')
      }

    } catch (error) {
      console.error('Failed to connect to metrics WebSocket:', error)
      this.isConnecting = false
      this.recordConnectionFailure()
    }
  }

  handleMetricsMessage(data) {
    try {
      const { type, payload, timestamp } = data

      switch (type) {
        case 'system_metrics':
          this.metricsStore.updateSystemMetrics(payload)
          break
          
        case 'model_metrics':
          this.metricsStore.updateModelMetrics(payload)
          break
          
        case 'api_metrics':
          this.metricsStore.updateApiMetrics(payload)
          break
          
        case 'circuit_breaker_stats':
          this.metricsStore.updateCircuitBreakerStats(payload)
          break
          
        case 'health_status':
          this.metricsStore.updateHealthStatus(payload)
          break
          
        case 'alert':
          this.metricsStore.addAlert(payload)
          break
          
        default:
          console.warn('Unknown metrics message type:', type)
      }
    } catch (error) {
      console.error('Error handling metrics message:', error)
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++
    console.log(`Scheduling metrics WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(data)
    }
  }

  requestMetrics() {
    this.send({
      type: 'request_metrics',
      timestamp: Date.now()
    })
  }

  subscribeToMetrics(metrics) {
    this.send({
      type: 'subscribe',
      metrics,
      timestamp: Date.now()
    })
  }

  unsubscribeFromMetrics(metrics) {
    this.send({
      type: 'unsubscribe',
      metrics,
      timestamp: Date.now()
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.isConnecting = false
    this.messageQueue = []
    this.metricsStore.updateConnectionStatus('disconnected')
  }

  // Health check for the connection
  isHealthy() {
    return this.ws?.readyState === WebSocket.OPEN && 
           this.circuitBreaker.state !== 'open'
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isConnecting: this.isConnecting,
      messageQueueLength: this.messageQueue.length,
      circuitBreaker: this.getCircuitBreakerStats()
    }
  }
}

// Export singleton instance
export const metricsWebSocketService = new MetricsWebSocketService()

// Auto-connect on import
if (typeof window !== 'undefined') {
  // Only connect in browser environment
  metricsWebSocketService.connect()
}

export default metricsWebSocketService
