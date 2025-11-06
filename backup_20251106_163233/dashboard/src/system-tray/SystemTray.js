/**
 * System Tray Integration for Llama Runner Dashboard
 * Provides system tray-like functionality in web browsers
 */

class SystemTray {
  constructor() {
    this.isVisible = true
    this.notifications = []
    this.menuItems = []
    this.callbacks = {}
    this.trayElement = null
    
    // Tray states
    this.indicators = {
      connected: false,
      models: 0,
      proxies: 0,
      audio: false
    }
    
    this.init()
  }

  init() {
    this.createTrayElement()
    this.createNotificationSystem()
    this.setupKeyboardShortcuts()
    this.setupEventListeners()
  }

  /**
   * Creates the system tray interface element
   */
  createTrayElement() {
    // Create main tray container
    this.trayElement = document.createElement('div')
    this.trayElement.id = 'system-tray'
    this.trayElement.className = 'system-tray'
    
    // Create tray content
    this.trayElement.innerHTML = `
      <div class="tray-header">
        <div class="tray-logo">
          <img src="../app_icon.png" alt="Llama Runner" class="tray-icon">
          <span class="tray-title">Llama Runner</span>
        </div>
        <div class="tray-controls">
          <button class="tray-btn tray-minimize" title="Minimiser">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2 7h10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <button class="tray-btn tray-close" title="Fermer">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M4 4l6 6M10 4L4 10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="tray-content">
        <div class="tray-status">
          <div class="status-indicator" id="tray-status-indicator">
            <div class="status-dot"></div>
            <span class="status-text">Déconnecté</span>
          </div>
          
          <div class="tray-stats">
            <div class="stat-item">
              <span class="stat-label">Modèles:</span>
              <span class="stat-value" id="tray-models-count">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Proxies:</span>
              <span class="stat-value" id="tray-proxies-count">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Audio:</span>
              <span class="stat-value" id="tray-audio-status">OFF</span>
            </div>
          </div>
        </div>
        
        <div class="tray-actions">
          <button class="tray-action-btn" id="tray-toggle-dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>Dashboard</span>
          </button>
          
          <button class="tray-action-btn" id="tray-quick-model">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
              <path d="M6 6h.01M18 6h.01M6 18h.01M18 18h.01"/>
            </svg>
            <span>Modèle Rapide</span>
          </button>
          
          <button class="tray-action-btn" id="tray-restart-service">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>Redémarrer</span>
          </button>
        </div>
      </div>
      
      <div class="tray-footer">
        <div class="tray-version">v1.0.0</div>
        <div class="tray-connection-status" id="tray-connection-status">
          <div class="connection-dot"></div>
          <span>En ligne</span>
        </div>
      </div>
    `
    
    // Add styles
    this.addTrayStyles()
    
    // Add to page
    document.body.appendChild(this.trayElement)
    
    this.setupTrayEventListeners()
  }

  /**
   * Adds CSS styles for the system tray
   */
  addTrayStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .system-tray {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: linear-gradient(145deg, #ffffff, #f8f9fa);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin: top right;
      }
      
      .system-tray.hidden {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
        pointer-events: none;
      }
      
      .system-tray.collapsed {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
      }
      
      .tray-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 12px 0 0;
      }
      
      .tray-logo {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .tray-icon {
        width: 20px;
        height: 20px;
        border-radius: 4px;
      }
      
      .tray-title {
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .tray-controls {
        display: flex;
        gap: 4px;
        opacity: 0.8;
      }
      
      .tray-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: inherit;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
      }
      
      .tray-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .tray-content {
        padding: 16px;
      }
      
      .tray-status {
        margin-bottom: 16px;
      }
      
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f56c6c;
        animation: pulse 2s infinite;
      }
      
      .status-indicator.connected .status-dot {
        background: #67c23a;
      }
      
      .status-indicator.disconnected .status-dot {
        background: #e6a23c;
      }
      
      .status-text {
        font-size: 13px;
        font-weight: 500;
        color: #303133;
      }
      
      .tray-stats {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
      }
      
      .stat-label {
        color: #909399;
      }
      
      .stat-value {
        font-weight: 600;
        color: #303133;
      }
      
      .tray-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .tray-action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: none;
        background: #f5f7fa;
        border-radius: 8px;
        color: #606266;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
      }
      
      .tray-action-btn:hover {
        background: #e4e7ed;
        transform: translateX(2px);
      }
      
      .tray-action-btn:active {
        transform: translateX(0);
      }
      
      .tray-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: #f8f9fa;
        border-radius: 0 0 12px 12px;
        font-size: 10px;
        color: #909399;
      }
      
      .connection-status {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .connection-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #67c23a;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      /* Collapsed state */
      .system-tray.collapsed .tray-header {
        justify-content: center;
        padding: 12px;
      }
      
      .system-tray.collapsed .tray-logo {
        justify-content: center;
      }
      
      .system-tray.collapsed .tray-title,
      .system-tray.collapsed .tray-controls,
      .system-tray.collapsed .tray-content,
      .system-tray.collapsed .tray-footer {
        display: none;
      }
      
      /* Notification styles */
      .tray-notification {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 350px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid #e4e7ed;
        z-index: 10001;
        animation: slideInRight 0.3s ease-out;
      }
      
      .tray-notification.error {
        border-left: 4px solid #f56c6c;
      }
      
      .tray-notification.success {
        border-left: 4px solid #67c23a;
      }
      
      .tray-notification.warning {
        border-left: 4px solid #e6a23c;
      }
      
      .tray-notification.info {
        border-left: 4px solid #409eff;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .system-tray {
          width: 280px;
          top: 10px;
          right: 10px;
        }
        
        .tray-notification {
          width: calc(100vw - 20px);
          right: 10px;
        }
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Sets up event listeners for tray interactions
   */
  setupTrayEventListeners() {
    const minimizeBtn = this.trayElement.querySelector('.tray-minimize')
    const closeBtn = this.trayElement.querySelector('.tray-close')
    const toggleDashboard = this.trayElement.querySelector('#tray-toggle-dashboard')
    const quickModel = this.trayElement.querySelector('#tray-quick-model')
    const restartService = this.trayElement.querySelector('#tray-restart-service')

    // Minimize/collapse tray
    minimizeBtn.addEventListener('click', () => {
      this.toggleCollapsed()
    })

    // Close/hide tray
    closeBtn.addEventListener('click', () => {
      this.hide()
    })

    // Toggle dashboard visibility
    toggleDashboard.addEventListener('click', () => {
      this.emit('toggleDashboard')
    })

    // Quick model switching
    quickModel.addEventListener('click', () => {
      this.emit('quickModelSwitch')
    })

    // Restart service
    restartService.addEventListener('click', () => {
      this.emit('restartService')
    })

    // Drag to move (simulated)
    this.trayElement.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tray-header')) {
        this.startDrag(e)
      }
    })
  }

  /**
   * Sets up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+` or Alt+T to toggle tray
      if ((e.ctrlKey && e.key === '`') || (e.altKey && e.key === 't')) {
        e.preventDefault()
        this.toggle()
      }
      
      // Escape to hide
      if (e.key === 'Escape') {
        this.hide()
      }
    })
  }

  /**
   * Sets up global event listeners
   */
  setupEventListeners() {
    // Auto-hide on window blur (optional)
    window.addEventListener('blur', () => {
      if (this.autoHide) {
        this.hide()
      }
    })

    // Show on focus
    window.addEventListener('focus', () => {
      if (this.autoShowOnFocus) {
        this.show()
      }
    })

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden()
      } else {
        this.onPageVisible()
      }
    })
  }

  /**
   * Creates notification system
   */
  createNotificationSystem() {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  /**
   * Shows the system tray
   */
  show() {
    this.trayElement.classList.remove('hidden')
    this.isVisible = true
    this.emit('visibilityChanged', { visible: true })
  }

  /**
   * Hides the system tray
   */
  hide() {
    this.trayElement.classList.add('hidden')
    this.isVisible = false
    this.emit('visibilityChanged', { visible: false })
  }

  /**
   * Toggles tray visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Toggles collapsed state
   */
  toggleCollapsed() {
    this.trayElement.classList.toggle('collapsed')
    this.isCollapsed = !this.isCollapsed
  }

  /**
   * Updates connection status
   */
  updateConnectionStatus(connected) {
    const indicator = this.trayElement.querySelector('#tray-status-indicator')
    const text = indicator.querySelector('.status-text')
    
    indicator.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`
    text.textContent = connected ? 'Connecté' : 'Déconnecté'
    
    this.indicators.connected = connected
  }

  /**
   * Updates model count
   */
  updateModelCount(count) {
    const element = this.trayElement.querySelector('#tray-models-count')
    element.textContent = count
    this.indicators.models = count
  }

  /**
   * Updates proxy count
   */
  updateProxyCount(count) {
    const element = this.trayElement.querySelector('#tray-proxies-count')
    element.textContent = count
    this.indicators.proxies = count
  }

  /**
   * Updates audio status
   */
  updateAudioStatus(enabled) {
    const element = this.trayElement.querySelector('#tray-audio-status')
    element.textContent = enabled ? 'ON' : 'OFF'
    element.style.color = enabled ? '#67c23a' : '#f56c6c'
    this.indicators.audio = enabled
  }

  /**
   * Shows a notification
   */
  showNotification(title, message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `tray-notification ${type}`
    notification.innerHTML = `
      <div style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #303133;">${title}</h4>
          <button class="notification-close" style="background: none; border: none; color: #909399; cursor: pointer; padding: 0;">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M4 4l6 6M10 4L4 10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
        <p style="margin: 0; font-size: 13px; color: #606266; line-height: 1.4;">${message}</p>
      </div>
    `

    // Add to page
    document.body.appendChild(notification)

    // Auto-remove after duration
    const timeout = setTimeout(() => {
      this.removeNotification(notification)
    }, duration)

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      clearTimeout(timeout)
      this.removeNotification(notification)
    })

    // Store notification
    this.notifications.push({ element: notification, timeout })

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '../app_icon.png'
      })
    }

    this.emit('notificationShown', { title, message, type })
  }

  /**
   * Removes a notification
   */
  removeNotification(notification) {
    const index = this.notifications.findIndex(n => n.element === notification)
    if (index > -1) {
      clearTimeout(this.notifications[index].timeout)
      this.notifications.splice(index, 1)
    }
    
    notification.style.animation = 'slideOutRight 0.3s ease-out'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }

  /**
   * Starts drag operation (simulated)
   */
  startDrag(e) {
    e.preventDefault()
    const rect = this.trayElement.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const initialRight = window.innerWidth - rect.right
    const initialTop = rect.top

    const handleMouseMove = (e) => {
      const deltaX = startX - e.clientX
      const deltaY = e.clientY - startY
      const newRight = Math.max(20, initialRight + deltaX)
      const newTop = Math.max(20, Math.min(window.innerHeight - rect.height - 20, initialTop + deltaY))
      
      this.trayElement.style.right = `${newRight}px`
      this.trayElement.style.top = `${newTop}px`
      this.trayElement.style.left = 'auto'
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }

  /**
   * Page visibility handlers
   */
  onPageHidden() {
    // Hide tray when page is hidden (optional)
  }

  onPageVisible() {
    // Show tray when page is visible (optional)
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown)
    
    // Remove notifications
    this.notifications.forEach(({ element, timeout }) => {
      clearTimeout(timeout)
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
    
    // Remove tray element
    if (this.trayElement && this.trayElement.parentNode) {
      this.trayElement.parentNode.removeChild(this.trayElement)
    }
  }
}

// Export for use
export default SystemTray

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.llamaSystemTray = new SystemTray()
    })
  } else {
    window.llamaSystemTray = new SystemTray()
  }
}