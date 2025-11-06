/**
 * Hot Reload Configuration System
 * Enables real-time configuration updates without restart
 */

import { debounce } from '../utils/debounce'

class HotReloadConfig {
  constructor(options = {}) {
    this.options = {
      watchInterval: 1000, // Check every second
      debounceDelay: 500, // Debounce changes by 500ms
      autoBackup: true,
      maxBackups: 10,
      validationEnabled: true,
      rollbackOnError: true,
      notifyChanges: true,
      ...options
    }
    
    this.config = {}
    this.originalConfig = {}
    this.backupConfigs = []
    this.watchers = new Set()
    this.isWatching = false
    this.lastModified = null
    this.changeQueue = []
    this.isApplyingChanges = false
    
    // Event callbacks
    this.callbacks = {
      onConfigChange: [],
      onConfigError: [],
      onConfigValidate: [],
      onConfigBackup: [],
      onConfigRollback: []
    }
    
    this.init()
  }

  /**
   * Initialize hot reload system
   */
  init() {
    console.log('🔥 Hot Reload Configuration System initialized')
    
    // Load initial configuration
    this.loadInitialConfig()
    
    // Start watching for changes
    this.startWatching()
    
    // Setup automatic cleanup
    this.setupCleanup()
    
    // Setup error handling
    this.setupErrorHandling()
  }

  /**
   * Load initial configuration
   */
  async loadInitialConfig() {
    try {
      const response = await fetch('/api/config/current')
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`)
      }
      
      this.config = await response.json()
      this.originalConfig = JSON.parse(JSON.stringify(this.config))
      this.lastModified = new Date()
      
      console.log('📋 Initial configuration loaded', this.config)
      this.emit('onConfigChange', { type: 'initial_load', config: this.config })
      
    } catch (error) {
      console.error('❌ Failed to load initial configuration:', error)
      this.emit('onConfigError', { type: 'initial_load', error })
    }
  }

  /**
   * Start watching for configuration changes
   */
  startWatching() {
    if (this.isWatching) return
    
    this.isWatching = true
    
    // Watch for file changes
    this.fileWatcher = setInterval(() => {
      this.checkForChanges()
    }, this.options.watchInterval)
    
    // Watch for API changes
    this.setupAPIWatcher()
    
    console.log('👀 Started watching for configuration changes')
  }

  /**
   * Stop watching for changes
   */
  stopWatching() {
    if (!this.isWatching) return
    
    this.isWatching = false
    
    if (this.fileWatcher) {
      clearInterval(this.fileWatcher)
      this.fileWatcher = null
    }
    
    if (this.apiWatcher) {
      clearInterval(this.apiWatcher)
      this.apiWatcher = null
    }
    
    console.log('🛑 Stopped watching for configuration changes')
  }

  /**
   * Check for configuration changes
   */
  async checkForChanges() {
    try {
      const response = await fetch('/api/config/last-modified')
      const { lastModified } = await response.json()
      
      if (lastModified && lastModified !== this.lastModified) {
        await this.handleConfigChange(lastModified)
      }
    } catch (error) {
      console.error('Error checking for config changes:', error)
    }
  }

  /**
   * Handle detected configuration change
   */
  async handleConfigChange(newLastModified) {
    console.log('🔄 Configuration change detected')
    
    try {
      // Backup current configuration
      if (this.options.autoBackup) {
        await this.createBackup()
      }
      
      // Load new configuration
      const response = await fetch('/api/config/current')
      const newConfig = await response.json()
      
      // Validate changes
      if (this.options.validationEnabled) {
        const validation = await this.validateConfig(newConfig)
        if (!validation.isValid) {
          console.warn('⚠️ Configuration validation failed:', validation.errors)
          await this.handleValidationFailure(validation)
          return
        }
      }
      
      // Apply changes
      await this.applyConfigChanges(newConfig)
      
      this.lastModified = newLastModified
      
    } catch (error) {
      console.error('❌ Error handling config change:', error)
      await this.handleConfigError(error)
    }
  }

  /**
   * Validate configuration
   */
  async validateConfig(config) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    }
    
    try {
      // Send to server for validation
      const response = await fetch('/api/config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      
      const result = await response.json()
      validation.isValid = result.isValid
      validation.errors = result.errors || []
      validation.warnings = result.warnings || []
      
      this.emit('onConfigValidate', validation)
      
    } catch (error) {
      validation.isValid = false
      validation.errors.push(`Validation error: ${error.message}`)
    }
    
    return validation
  }

  /**
   * Apply configuration changes
   */
  async applyConfigChanges(newConfig) {
    if (this.isApplyingChanges) {
      console.log('⏳ Already applying changes, queuing...')
      this.changeQueue.push(newConfig)
      return
    }
    
    this.isApplyingChanges = true
    
    try {
      // Calculate diff
      const diff = this.calculateDiff(this.config, newConfig)
      console.log('📊 Configuration diff:', diff)
      
      // Apply changes to current config
      this.config = newConfig
      
      // Notify watchers
      this.notifyWatchers(diff)
      
      // Emit change event
      this.emit('onConfigChange', { 
        type: 'hot_reload', 
        config: this.config, 
        diff,
        timestamp: new Date()
      })
      
      // Show notification if enabled
      if (this.options.notifyChanges) {
        this.showChangeNotification(diff)
      }
      
      console.log('✅ Configuration changes applied successfully')
      
    } catch (error) {
      console.error('❌ Error applying config changes:', error)
      await this.handleConfigError(error)
    } finally {
      this.isApplyingChanges = false
      
      // Process queued changes
      if (this.changeQueue.length > 0) {
        const nextConfig = this.changeQueue.shift()
        await this.applyConfigChanges(nextConfig)
      }
    }
  }

  /**
   * Calculate diff between old and new config
   */
  calculateDiff(oldConfig, newConfig) {
    const diff = {
      added: {},
      modified: {},
      removed: {},
      unchanged: {}
    }
    
    const allKeys = new Set([
      ...Object.keys(oldConfig || {}),
      ...Object.keys(newConfig || {})
    ])
    
    for (const key of allKeys) {
      const oldValue = oldConfig?.[key]
      const newValue = newConfig?.[key]
      
      if (oldValue === undefined) {
        diff.added[key] = newValue
      } else if (newValue === undefined) {
        diff.removed[key] = oldValue
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        if (typeof oldValue === 'object' && typeof newValue === 'object') {
          // Deep comparison for objects
          const deepDiff = this.calculateDiff(oldValue, newValue)
          if (Object.keys(deepDiff.added).length > 0 || 
              Object.keys(deepDiff.modified).length > 0 || 
              Object.keys(deepDiff.removed).length > 0) {
            diff.modified[key] = deepDiff
          }
        } else {
          diff.modified[key] = { old: oldValue, new: newValue }
        }
      } else {
        diff.unchanged[key] = oldValue
      }
    }
    
    return diff
  }

  /**
   * Show change notification
   */
  showChangeNotification(diff) {
    const changes = this.getChangeSummary(diff)
    
    if (changes.total === 0) return
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Configuration Updated', {
        body: `${changes.total} changes applied automatically`,
        icon: '../app_icon.png',
        tag: 'config-hot-reload'
      })
    }
    
    // Show in-app notification
    if (window.llamaSystemTray) {
      window.llamaSystemTray.showNotification(
        'Configuration Updated',
        `${changes.total} changes applied automatically`,
        'success',
        3000
      )
    }
  }

  /**
   * Get summary of changes
   */
  getChangeSummary(diff) {
    const countProperties = (obj) => {
      if (!obj || typeof obj !== 'object') return 0
      return Object.keys(obj).length
    }
    
    const total = countProperties(diff.added) + countProperties(diff.modified) + countProperties(diff.removed)
    
    return {
      added: countProperties(diff.added),
      modified: countProperties(diff.modified),
      removed: countProperties(diff.removed),
      total
    }
  }

  /**
   * Create configuration backup
   */
  async createBackup() {
    try {
      const backup = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        config: JSON.parse(JSON.stringify(this.config)),
        version: this.getConfigVersion()
      }
      
      this.backupConfigs.unshift(backup)
      
      // Keep only maxBackups
      if (this.backupConfigs.length > this.options.maxBackups) {
        this.backupConfigs = this.backupConfigs.slice(0, this.options.maxBackups)
      }
      
      // Send to server
      await fetch('/api/config/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup)
      })
      
      this.emit('onConfigBackup', backup)
      
    } catch (error) {
      console.error('Failed to create backup:', error)
    }
  }

  /**
   * Rollback to previous configuration
   */
  async rollback(backupId = null) {
    try {
      let backupToRestore
      
      if (backupId) {
        backupToRestore = this.backupConfigs.find(b => b.id === backupId)
      } else {
        backupToRestore = this.backupConfigs[1] // Use second most recent (first is current)
      }
      
      if (!backupToRestore) {
        throw new Error('No backup found to rollback to')
      }
      
      console.log('🔄 Rolling back configuration to:', backupToRestore.timestamp)
      
      // Apply backup configuration
      await this.applyConfigChanges(backupToRestore.config)
      
      this.emit('onConfigRollback', backupToRestore)
      
      // Show notification
      if (window.llamaSystemTray) {
        window.llamaSystemTray.showNotification(
          'Configuration Rolled Back',
          'Successfully reverted to previous configuration',
          'warning',
          5000
        )
      }
      
    } catch (error) {
      console.error('❌ Rollback failed:', error)
      this.emit('onConfigError', { type: 'rollback', error })
    }
  }

  /**
   * Handle validation failure
   */
  async handleValidationFailure(validation) {
    if (this.options.rollbackOnError) {
      console.log('🔄 Rolling back due to validation failure')
      await this.rollback()
    } else {
      // Show validation errors
      if (window.llamaSystemTray) {
        const errorMsg = validation.errors.join(', ')
        window.llamaSystemTray.showNotification(
          'Configuration Validation Failed',
          errorMsg,
          'error',
          8000
        )
      }
    }
  }

  /**
   * Handle configuration error
   */
  async handleConfigError(error) {
    this.emit('onConfigError', { type: 'hot_reload', error })
    
    if (this.options.rollbackOnError) {
      await this.rollback()
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return this.config
  }

  /**
   * Get configuration backup list
   */
  getBackups() {
    return this.backupConfigs
  }

  /**
   * Update configuration manually
   */
  updateConfig(newConfig, options = {}) {
    const mergedConfig = { ...this.config, ...newConfig }
    
    return this.applyConfigChanges(mergedConfig)
  }

  /**
   * Watch for configuration changes
   */
  watch(callback) {
    this.watchers.add(callback)
    return () => this.watchers.delete(callback)
  }

  /**
   * Notify all watchers
   */
  notifyWatchers(diff) {
    this.watchers.forEach(callback => {
      try {
        callback(this.config, diff)
      } catch (error) {
        console.error('Error in config watcher:', error)
      }
    })
  }

  /**
   * Get configuration version
   */
  getConfigVersion() {
    return this.config?.version || '1.0.0'
  }

  /**
   * Setup API watcher for real-time changes
   */
  setupAPIWatcher() {
    // Use Server-Sent Events or WebSocket for real-time updates
    if ('EventSource' in window) {
      this.eventSource = new EventSource('/api/config/events')
      
      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'config_updated') {
          this.handleConfigChange(data.lastModified)
        }
      }
      
      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error)
      }
    }
  }

  /**
   * Setup automatic cleanup
   */
  setupCleanup() {
    // Cleanup old backups periodically
    setInterval(() => {
      this.cleanupOldBackups()
    }, 60000) // Every minute
  }

  /**
   * Cleanup old backups
   */
  cleanupOldBackups() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    this.backupConfigs = this.backupConfigs.filter(backup => {
      return (now - backup.id) < maxAge
    })
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Global error handler for config operations
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.configRelated) {
        console.error('Unhandled config error:', event.reason)
        this.handleConfigError(event.reason)
      }
    })
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
   * Get statistics
   */
  getStats() {
    return {
      isWatching: this.isWatching,
      lastModified: this.lastModified,
      backupCount: this.backupConfigs.length,
      watcherCount: this.watchers.size,
      queuedChanges: this.changeQueue.length,
      configVersion: this.getConfigVersion()
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stopWatching()
    
    if (this.eventSource) {
      this.eventSource.close()
    }
    
    this.watchers.clear()
    this.changeQueue = []
    
    console.log('🗑️ Hot Reload Configuration System destroyed')
  }
}

// Debounce utility
function debounce(func, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

export default HotReloadConfig