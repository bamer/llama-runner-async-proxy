import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import HotReloadConfig from '@/js/HotReloadConfig.js'

// Mock WebSocket and FileSystem APIs
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1
}))

global.fetch = vi.fn()

describe('HotReloadConfig', () => {
  let hotReloadConfig
  let mockWebSocket

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    
    // Create a fresh instance
    hotReloadConfig = new HotReloadConfig()
    
    // Mock WebSocket instance
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      readyState: 1
    }
    
    global.WebSocket = vi.fn(() => mockWebSocket)
  })

  afterEach(() => {
    hotReloadConfig.destroy()
  })

  it('initialise la configuration hot reload', () => {
    expect(hotReloadConfig.isWatching).toBe(false)
    expect(hotReloadConfig.isConnected).toBe(false)
    expect(hotReloadConfig.configPath).toBe('/api/config')
  })

  it('démarre le monitoring de configuration', async () => {
    await hotReloadConfig.startWatching()
    
    expect(hotReloadConfig.isWatching).toBe(true)
    expect(hotReloadConfig.isConnected).toBe(true)
  })

  it('arrête le monitoring', async () => {
    await hotReloadConfig.startWatching()
    await hotReloadConfig.stopWatching()
    
    expect(hotReloadConfig.isWatching).toBe(false)
    expect(hotReloadConfig.isConnected).toBe(false)
  })

  it('charge la configuration initiale', async () => {
    const mockConfig = {
      models: ['model1', 'model2'],
      settings: { debug: false }
    }
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockConfig)
      })
    )
    
    const config = await hotReloadConfig.loadInitialConfig()
    
    expect(config).toEqual(mockConfig)
    expect(global.fetch).toHaveBeenCalledWith('/api/config')
  })

  it('gère les erreurs de chargement de configuration', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Network error'))
    )
    
    await expect(hotReloadConfig.loadInitialConfig()).rejects.toThrow('Network error')
  })

  it('met à jour la configuration', async () => {
    const newConfig = { models: ['new-model'] }
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    )
    
    await hotReloadConfig.updateConfig(newConfig)
    
    expect(global.fetch).toHaveBeenCalledWith('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    })
  })

  it('écoute les changements de configuration via WebSocket', async () => {
    await hotReloadConfig.startWatching()
    
    // Simulate WebSocket message
    const configChangeHandler = mockWebSocket.addEventListener.mock.calls[0][1]
    const mockEvent = {
      data: JSON.stringify({
        type: 'config_updated',
        config: { models: ['updated-model'] }
      })
    }
    
    configChangeHandler(mockEvent)
    
    expect(hotReloadConfig.lastUpdate).toBeDefined()
  })

  it('traite les messages de reconnect', async () => {
    await hotReloadConfig.startWatching()
    
    const reconnectHandler = mockWebSocket.addEventListener.mock.calls[1][1]
    const mockEvent = {
      data: JSON.stringify({
        type: 'reconnected',
        timestamp: Date.now()
      })
    }
    
    reconnectHandler(mockEvent)
    
    expect(hotReloadConfig.isConnected).toBe(true)
  })

  it('gère les erreurs WebSocket', async () => {
    await hotReloadConfig.startWatching()
    
    const errorHandler = mockWebSocket.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1]
    
    const mockError = new Error('WebSocket error')
    errorHandler(mockError)
    
    expect(hotReloadConfig.isConnected).toBe(false)
  })

  it('gère la reconnexion automatique', async () => {
    await hotReloadConfig.startWatching()
    
    // Simulate connection close
    const closeHandler = mockWebSocket.addEventListener.mock.calls.find(
      call => call[0] === 'close'
    )[1]
    
    const mockEvent = { code: 1006, reason: 'Connection lost' }
    closeHandler(mockEvent)
    
    // Should attempt to reconnect
    expect(hotReloadConfig.isConnected).toBe(false)
  })

  it('valide la configuration avant application', () => {
    const validConfig = {
      models: ['model1'],
      settings: { debug: true }
    }
    
    const invalidConfig = {
      models: null,  // Invalid
      settings: 'invalid'  // Should be object
    }
    
    expect(hotReloadConfig.validateConfig(validConfig)).toBe(true)
    expect(hotReloadConfig.validateConfig(invalidConfig)).toBe(false)
  })

  it('applique les changements de configuration', async () => {
    const configHandler = vi.fn()
    hotReloadConfig.on('config-change', configHandler)
    
    const newConfig = { models: ['test-model'] }
    await hotReloadConfig.applyConfigChange(newConfig)
    
    expect(configHandler).toHaveBeenCalledWith(newConfig)
  })

  it('sauvegarde automatiquement après modifications', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    )
    
    hotReloadConfig.enableAutoSave(true)
    const newConfig = { models: ['auto-save-model'] }
    
    await hotReloadConfig.applyConfigChange(newConfig)
    
    // Should auto-save after delay
    expect(global.fetch).toHaveBeenCalled()
  })

  it('gère les conflits de configuration', async () => {
    const configHandler = vi.fn()
    hotReloadConfig.on('config-conflict', configHandler)
    
    const serverConfig = { models: ['server-model'], version: 2 }
    const localConfig = { models: ['local-model'], version: 1 }
    
    await hotReloadConfig.handleConfigConflict(serverConfig, localConfig)
    
    expect(configHandler).toHaveBeenCalled()
  })

  it('envoie un ping pour maintenir la connexion', async () => {
    await hotReloadConfig.startWatching()
    
    hotReloadConfig.sendPing()
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({
      type: 'ping',
      timestamp: expect.any(Number)
    }))
  })

  it('crée une sauvegarde avant modification importante', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    )
    
    await hotReloadConfig.createBackup()
    
    expect(global.fetch).toHaveBeenCalledWith('/api/config/backup', {
      method: 'POST'
    })
  })

  it('restaure une sauvegarde', async () => {
    const backupData = { models: ['backup-model'], timestamp: Date.now() }
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(backupData)
      })
    )
    
    const restoredConfig = await hotReloadConfig.restoreBackup()
    
    expect(restoredConfig).toEqual(backupData)
    expect(global.fetch).toHaveBeenCalledWith('/api/config/backup/latest')
  })

  it('exporte l\'historique des modifications', () => {
    const config = { models: ['test'] }
    hotReloadConfig.configHistory.push(config)
    
    const history = hotReloadConfig.getConfigHistory()
    
    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(config)
  })

  it('compare les versions de configuration', () => {
    const oldConfig = { version: 1, models: ['old'] }
    const newConfig = { version: 2, models: ['new'] }
    
    const diff = hotReloadConfig.compareConfigs(oldConfig, newConfig)
    
    expect(diff).toEqual(expect.objectContaining({
      version: { from: 1, to: 2 },
      models: { from: ['old'], to: ['new'] }
    }))
  })

  it('clean l\'ancien historique automatiquement', () => {
    // Fill up history with old entries
    const oldDate = Date.now() - (1000 * 60 * 60 * 24 * 8) // 8 days ago
    for (let i = 0; i < 15; i++) {
      hotReloadConfig.configHistory.push({
        timestamp: oldDate - i,
        config: { models: [`model${i}`] }
      })
    }
    
    hotReloadConfig.cleanOldHistory(7) // Keep only 7 days
    
    // Should clean old entries
    expect(hotReloadConfig.configHistory.length).toBeLessThan(15)
  })

  it('destroy nettoie toutes les ressources', async () => {
    await hotReloadConfig.startWatching()
    hotReloadConfig.destroy()
    
    expect(mockWebSocket.close).toHaveBeenCalled()
    expect(hotReloadConfig.isWatching).toBe(false)
    expect(hotReloadConfig.isConnected).toBe(false)
  })
})