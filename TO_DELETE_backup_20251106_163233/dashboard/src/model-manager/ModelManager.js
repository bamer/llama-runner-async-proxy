/**
 * Automatic Model Management System
 * Handles discovery, lifecycle, and optimization of AI models
 */

class ModelManager {
  constructor(options = {}) {
    this.options = {
      autoDiscovery: true,
      discoveryInterval: 300000, // 5 minutes
      healthCheckInterval: 60000, // 1 minute
      autoCleanup: true,
      maxModels: 50,
      memoryThreshold: 80, // percentage
      performanceThreshold: 1000, // ms response time
      autoDownload: false,
      preferredFormats: ['.gguf', '.bin', '.safetensors'],
      ...options
    }
    
    this.models = new Map()
    this.discoveredModels = []
    this.activeModels = new Set()
    this.modelStats = new Map()
    this.healthCheckResults = new Map()
    this.discoveryPaths = []
    this.performanceMetrics = new Map()
    
    // Event callbacks
    this.callbacks = {
      onModelDiscovered: [],
      onModelLoaded: [],
      onModelUnloaded: [],
      onModelError: [],
      onHealthCheck: [],
      onPerformanceAlert: [],
      onAutoCleanup: []
    }
    
    this.init()
  }

  /**
   * Initialize model manager
   */
  async init() {
    console.log('🤖 Automatic Model Management System initialized')
    
    // Load existing models
    await this.loadExistingModels()
    
    // Start auto-discovery if enabled
    if (this.options.autoDiscovery) {
      this.startAutoDiscovery()
    }
    
    // Start health monitoring
    this.startHealthMonitoring()
    
    // Setup periodic cleanup
    if (this.options.autoCleanup) {
      this.startPeriodicCleanup()
    }
    
    console.log(`📊 Model Manager initialized: ${this.models.size} models loaded`)
  }

  /**
   * Load existing models from configuration
   */
  async loadExistingModels() {
    try {
      const response = await fetch('/api/models')
      const modelsData = await response.json()
      
      for (const [modelId, modelConfig] of Object.entries(modelsData)) {
        const model = {
          id: modelId,
          ...modelConfig,
          status: 'loaded',
          discovered: false,
          health: 'unknown',
          lastUsed: new Date(),
          loadTime: null,
          memoryUsage: 0,
          performanceScore: 0
        }
        
        this.models.set(modelId, model)
        
        // Initialize performance tracking
        this.performanceMetrics.set(modelId, {
          requestCount: 0,
          averageLatency: 0,
          successRate: 100,
          errorCount: 0
        })
      }
      
    } catch (error) {
      console.error('Failed to load existing models:', error)
    }
  }

  /**
   * Start automatic model discovery
   */
  startAutoDiscovery() {
    this.discoveryInterval = setInterval(async () => {
      await this.discoverModels()
    }, this.options.discoveryInterval)
    
    // Initial discovery
    this.discoverModels()
    
    console.log('🔍 Started automatic model discovery')
  }

  /**
   * Discover new models in configured paths
   */
  async discoverModels() {
    try {
      const response = await fetch('/api/models/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paths: this.discoveryPaths,
          formats: this.options.preferredFormats,
          recursive: true
        })
      })
      
      const discovered = await response.json()
      const newModels = discovered.filter(model => !this.models.has(model.id))
      
      if (newModels.length > 0) {
        console.log(`🆕 Discovered ${newModels.length} new models`)
        
        for (const modelData of newModels) {
          await this.handleNewModel(modelData)
        }
        
        this.emit('onModelDiscovered', newModels)
      }
      
      this.discoveredModels = discovered
      
    } catch (error) {
      console.error('Model discovery failed:', error)
    }
  }

  /**
   * Handle newly discovered model
   */
  async handleNewModel(modelData) {
    const model = {
      id: modelData.id,
      name: modelData.name,
      path: modelData.path,
      size: modelData.size,
      format: modelData.format,
      metadata: modelData.metadata || {},
      status: 'discovered',
      discovered: true,
      health: 'unknown',
      discoveredAt: new Date(),
      priority: this.calculateModelPriority(modelData),
      autoLoad: this.shouldAutoLoad(modelData),
      tags: this.generateModelTags(modelData)
    }
    
    this.models.set(model.id, model)
    
    // Auto-load if configured and within limits
    if (model.autoLoad && this.shouldLoadModel(model)) {
      await this.loadModel(model.id)
    }
  }

  /**
   * Calculate model priority based on various factors
   */
  calculateModelPriority(modelData) {
    let priority = 5 // default priority
    
    // Size factor (smaller models get higher priority)
    const sizeMB = modelData.size / (1024 * 1024)
    if (sizeMB < 1000) priority += 2
    else if (sizeMB < 5000) priority += 1
    
    // Format preference
    if (modelData.format === '.gguf') priority += 2
    
    // Name-based priority
    const name = modelData.name.toLowerCase()
    if (name.includes('fast') || name.includes('tiny')) priority += 2
    if (name.includes('base') || name.includes('7b')) priority += 1
    
    // Recently modified gets higher priority
    const daysSinceModified = (Date.now() - modelData.lastModified) / (1000 * 60 * 60 * 24)
    if (daysSinceModified < 7) priority += 1
    
    return Math.min(10, Math.max(1, priority))
  }

  /**
   * Determine if model should be auto-loaded
   */
  shouldAutoLoad(modelData) {
    const sizeMB = modelData.size / (1024 * 1024)
    
    // Don't auto-load very large models
    if (sizeMB > 10000) return false
    
    // Auto-load small to medium models
    if (sizeMB < 5000) return true
    
    // Check current load
    if (this.activeModels.size >= this.options.maxModels) return false
    
    return false
  }

  /**
   * Generate tags for model
   */
  generateModelTags(modelData) {
    const tags = []
    const name = modelData.name.toLowerCase()
    
    // Language detection
    if (name.includes('multilingual') || name.includes('multilang')) {
      tags.push('multilingual')
    } else if (name.includes('en') || name.includes('english')) {
      tags.push('english')
    } else if (name.includes('fr') || name.includes('french')) {
      tags.push('french')
    }
    
    // Model type
    if (name.includes('instruct') || name.includes('chat')) {
      tags.push('instruction-following')
    }
    
    if (name.includes('code') || name.includes('coder')) {
      tags.push('code-generation')
    }
    
    if (name.includes('vision') || name.includes('vl') || name.includes('visual')) {
      tags.push('vision-capable')
    }
    
    // Size category
    const sizeGB = modelData.size / (1024 * 1024 * 1024)
    if (sizeGB < 1) tags.push('lightweight')
    else if (sizeGB < 7) tags.push('medium')
    else if (sizeGB < 13) tags.push('large')
    else tags.push('very-large')
    
    // Format
    tags.push(modelData.format.replace('.', ''))
    
    return tags
  }

  /**
   * Load a model
   */
  async loadModel(modelId, options = {}) {
    const model = this.models.get(modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }
    
    if (this.activeModels.has(modelId)) {
      console.log(`Model ${modelId} is already loaded`)
      return
    }
    
    // Check memory usage
    const memoryUsage = await this.getSystemMemoryUsage()
    if (memoryUsage.percentage > this.options.memoryThreshold) {
      console.warn(`High memory usage (${memoryUsage.percentage}%), cleaning up before loading model`)
      await this.cleanupUnusedModels()
    }
    
    try {
      console.log(`📥 Loading model: ${model.name}`)
      model.status = 'loading'
      
      const startTime = Date.now()
      
      const response = await fetch(`/api/models/${modelId}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      model.status = 'loaded'
      model.loadTime = Date.now() - startTime
      model.lastUsed = new Date()
      model.health = 'healthy'
      
      this.activeModels.add(modelId)
      
      console.log(`✅ Model loaded successfully: ${model.name} (${model.loadTime}ms)`)
      
      this.emit('onModelLoaded', { model, loadTime: model.loadTime })
      
    } catch (error) {
      model.status = 'error'
      model.health = 'unhealthy'
      model.error = error.message
      
      console.error(`❌ Failed to load model ${modelId}:`, error)
      
      this.emit('onModelError', { model, error })
      
      throw error
    }
  }

  /**
   * Unload a model
   */
  async unloadModel(modelId) {
    const model = this.models.get(modelId)
    if (!model) {
      throw new Error(`Model ${modelId} not found`)
    }
    
    if (!this.activeModels.has(modelId)) {
      console.log(`Model ${modelId} is not loaded`)
      return
    }
    
    try {
      console.log(`📤 Unloading model: ${model.name}`)
      
      const response = await fetch(`/api/models/${modelId}/unload`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to unload model: ${response.statusText}`)
      }
      
      model.status = 'unloaded'
      model.health = 'unknown'
      model.loadTime = null
      
      this.activeModels.delete(modelId)
      
      console.log(`✅ Model unloaded successfully: ${model.name}`)
      
      this.emit('onModelUnloaded', { model })
      
    } catch (error) {
      console.error(`❌ Failed to unload model ${modelId}:`, error)
      throw error
    }
  }

  /**
   * Get system memory usage
   */
  async getSystemMemoryUsage() {
    try {
      const response = await fetch('/api/system/memory')
      const data = await response.json()
      
      return {
        used: data.used,
        total: data.total,
        percentage: (data.used / data.total) * 100
      }
    } catch (error) {
      console.error('Failed to get memory usage:', error)
      return { used: 0, total: 100, percentage: 0 }
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks()
    }, this.options.healthCheckInterval)
    
    console.log('❤️ Started health monitoring')
  }

  /**
   * Perform health checks on all loaded models
   */
  async performHealthChecks() {
    for (const modelId of this.activeModels) {
      try {
        const model = this.models.get(modelId)
        const healthCheck = await this.checkModelHealth(modelId)
        
        this.healthCheckResults.set(modelId, healthCheck)
        
        // Update model health status
        if (healthCheck.healthy) {
          model.health = 'healthy'
        } else {
          model.health = 'unhealthy'
          model.healthIssues = healthCheck.issues
        }
        
        // Check performance
        const metrics = this.performanceMetrics.get(modelId)
        if (metrics && metrics.averageLatency > this.options.performanceThreshold) {
          this.emit('onPerformanceAlert', {
            model,
            metric: metrics,
            threshold: this.options.performanceThreshold
          })
        }
        
        this.emit('onHealthCheck', { model, healthCheck })
        
      } catch (error) {
        console.error(`Health check failed for model ${modelId}:`, error)
      }
    }
  }

  /**
   * Check individual model health
   */
  async checkModelHealth(modelId) {
    try {
      const response = await fetch(`/api/models/${modelId}/health`)
      const data = await response.json()
      
      return {
        healthy: data.status === 'healthy',
        issues: data.issues || [],
        responseTime: data.responseTime,
        memoryUsage: data.memoryUsage,
        lastActivity: data.lastActivity
      }
    } catch (error) {
      return {
        healthy: false,
        issues: [`Health check failed: ${error.message}`],
        responseTime: null,
        memoryUsage: null,
        lastActivity: null
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup() {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupUnusedModels()
    }, 600000) // Every 10 minutes
    
    console.log('🧹 Started periodic cleanup')
  }

  /**
   * Cleanup unused models based on various criteria
   */
  async cleanupUnusedModels() {
    const memoryUsage = await this.getSystemMemoryUsage()
    const modelsToUnload = []
    
    for (const [modelId, model] of this.models) {
      if (!this.activeModels.has(modelId)) continue
      
      let shouldUnload = false
      let reason = []
      
      // Check memory usage
      if (memoryUsage.percentage > this.options.memoryThreshold) {
        shouldUnload = true
        reason.push('high memory usage')
      }
      
      // Check if model hasn't been used recently
      const hoursSinceLastUse = (Date.now() - model.lastUsed.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastUse > 24 && model.priority < 7) {
        shouldUnload = true
        reason.push('not used recently')
      }
      
      // Check performance issues
      const health = this.healthCheckResults.get(modelId)
      if (health && !health.healthy) {
        shouldUnload = true
        reason.push('health issues')
      }
      
      // Check priority (low priority models get unloaded first)
      if (this.activeModels.size >= this.options.maxModels && model.priority < 5) {
        shouldUnload = true
        reason.push('too many models loaded')
      }
      
      if (shouldUnload) {
        modelsToUnload.push({ modelId, reason: reason.join(', ') })
      }
    }
    
    // Sort by priority (lowest first)
    modelsToUnload.sort((a, b) => {
      const modelA = this.models.get(a.modelId)
      const modelB = this.models.get(b.modelId)
      return modelA.priority - modelB.priority
    })
    
    // Unload models
    for (const { modelId, reason } of modelsToUnload) {
      try {
        await this.unloadModel(modelId)
        console.log(`🗑️ Cleaned up model (${reason}): ${modelId}`)
      } catch (error) {
        console.error(`Failed to cleanup model ${modelId}:`, error)
      }
    }
    
    if (modelsToUnload.length > 0) {
      this.emit('onAutoCleanup', {
        modelsUnloaded: modelsToUnload.length,
        reasons: modelsToUnload
      })
    }
  }

  /**
   * Should load model (check limits and conditions)
   */
  shouldLoadModel(model) {
    // Check maximum models limit
    if (this.activeModels.size >= this.options.maxModels) {
      return false
    }
    
    // Check memory threshold
    // This would need to be implemented based on model size estimates
    
    return true
  }

  /**
   * Record model performance metrics
   */
  recordPerformance(modelId, metrics) {
    const current = this.performanceMetrics.get(modelId) || {
      requestCount: 0,
      averageLatency: 0,
      successRate: 100,
      errorCount: 0
    }
    
    // Update metrics
    current.requestCount++
    current.errorCount += metrics.success ? 0 : 1
    current.successRate = ((current.requestCount - current.errorCount) / current.requestCount) * 100
    
    // Update average latency
    current.averageLatency = ((current.averageLatency * (current.requestCount - 1)) + metrics.latency) / current.requestCount
    
    this.performanceMetrics.set(modelId, current)
    
    // Update model
    const model = this.models.get(modelId)
    if (model) {
      model.performanceScore = Math.max(0, 100 - (current.averageLatency / 10))
      model.lastUsed = new Date()
    }
  }

  /**
   * Get models by criteria
   */
  getModels(criteria = {}) {
    let results = Array.from(this.models.values())
    
    if (criteria.status) {
      results = results.filter(model => model.status === criteria.status)
    }
    
    if (criteria.health) {
      results = results.filter(model => model.health === criteria.health)
    }
    
    if (criteria.tags) {
      results = results.filter(model => 
        criteria.tags.some(tag => model.tags.includes(tag))
      )
    }
    
    if (criteria.search) {
      const query = criteria.search.toLowerCase()
      results = results.filter(model => 
        model.name.toLowerCase().includes(query) ||
        model.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return results
  }

  /**
   * Get model recommendations
   */
  getRecommendations(requirements = {}) {
    const models = Array.from(this.models.values())
    const recommendations = []
    
    for (const model of models) {
      let score = model.priority
      
      // Boost score based on requirements
      if (requirements.size && model.size <= requirements.size) {
        score += 2
      }
      
      if (requirements.tags) {
        const matchingTags = requirements.tags.filter(tag => model.tags.includes(tag))
        score += matchingTags.length
      }
      
      if (requirements.performance && model.performanceScore >= requirements.performance) {
        score += 3
      }
      
      if (requirements.language) {
        if (model.tags.includes(requirements.language) || model.tags.includes('multilingual')) {
          score += 2
        }
      }
      
      recommendations.push({
        model,
        score,
        reasons: this.getRecommendationReasons(model, requirements)
      })
    }
    
    return recommendations.sort((a, b) => b.score - a.score)
  }

  /**
   * Get recommendation reasons
   */
  getRecommendationReasons(model, requirements) {
    const reasons = []
    
    if (requirements.size && model.size <= requirements.size) {
      reasons.push('Fits size requirements')
    }
    
    if (requirements.tags) {
      const matching = requirements.tags.filter(tag => model.tags.includes(tag))
      if (matching.length > 0) {
        reasons.push(`Matches ${matching.join(', ')}`)
      }
    }
    
    if (requirements.performance && model.performanceScore >= requirements.performance) {
      reasons.push('High performance score')
    }
    
    if (model.priority >= 7) {
      reasons.push('High priority model')
    }
    
    return reasons
  }

  /**
   * Get system statistics
   */
  getStats() {
    const models = Array.from(this.models.values())
    
    return {
      total: models.length,
      loaded: this.activeModels.size,
      discovered: models.filter(m => m.discovered).length,
      healthy: models.filter(m => m.health === 'healthy').length,
      unhealthy: models.filter(m => m.health === 'unhealthy').length,
      bySize: {
        lightweight: models.filter(m => m.tags.includes('lightweight')).length,
        medium: models.filter(m => m.tags.includes('medium')).length,
        large: models.filter(m => m.tags.includes('large')).length,
        'very-large': models.filter(m => m.tags.includes('very-large')).length
      },
      byFormat: models.reduce((acc, model) => {
        acc[model.format] = (acc[model.format] || 0) + 1
        return acc
      }, {}),
      topPerforming: Array.from(this.performanceMetrics.entries())
        .sort((a, b) => b[1].averageLatency - a[1].averageLatency)
        .slice(0, 5)
        .map(([modelId, metrics]) => ({
          modelId,
          metrics,
          model: this.models.get(modelId)
        }))
    }
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    // Clear intervals
    if (this.discoveryInterval) clearInterval(this.discoveryInterval)
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval)
    if (this.cleanupInterval) clearInterval(this.cleanupInterval)
    
    // Clear data
    this.models.clear()
    this.discoveredModels = []
    this.activeModels.clear()
    this.modelStats.clear()
    this.healthCheckResults.clear()
    this.performanceMetrics.clear()
    
    console.log('🗑️ Model Manager destroyed')
  }
}

export default ModelManager