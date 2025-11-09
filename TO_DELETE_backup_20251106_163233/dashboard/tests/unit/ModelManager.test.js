import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import ModelManager from '@/js/ModelManager.js'

// Mock APIs
global.fetch = vi.fn()

describe('ModelManager', () => {
  let modelManager
  let mockEventListeners

  beforeEach(() => {
    vi.clearAllMocks()
    mockEventListeners = {}
    
    // Mock EventTarget methods
    const originalAddEventListener = EventTarget.prototype.addEventListener
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener
    const originalDispatchEvent = EventTarget.prototype.dispatchEvent
    
    EventTarget.prototype.addEventListener = vi.fn((event, handler) => {
      if (!mockEventListeners[event]) {
        mockEventListeners[event] = []
      }
      mockEventListeners[event].push(handler)
    })
    
    EventTarget.prototype.removeEventListener = vi.fn((event, handler) => {
      if (mockEventListeners[event]) {
        mockEventListeners[event] = mockEventListeners[event].filter(h => h !== handler)
      }
    })
    
    EventTarget.prototype.dispatchEvent = vi.fn((event) => {
      const eventName = event.type || 'custom'
      if (mockEventListeners[eventName]) {
        mockEventListeners[eventName].forEach(handler => handler(event))
      }
      return true
    })

    modelManager = new ModelManager()
  })

  afterEach(() => {
    modelManager.destroy()
  })

  it('initialise le gestionnaire de modèles', () => {
    expect(modelManager.isRunning).toBe(false)
    expect(modelManager.discoveredModels).toEqual([])
    expect(modelManager.autoDiscovery).toBe(true)
  })

  it('découvre automatiquement les modèles', async () => {
    const mockModels = [
      { name: 'model1.gguf', path: '/models/model1.gguf', size: 1024000000 },
      { name: 'model2.gguf', path: '/models/model2.gguf', size: 2048000000 }
    ]
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ models: mockModels })
      })
    )
    
    await modelManager.startAutoDiscovery()
    
    expect(global.fetch).toHaveBeenCalledWith('/api/models/scan')
    expect(modelManager.isRunning).toBe(true)
  })

  it('arrête la découverte automatique', async () => {
    await modelManager.startAutoDiscovery()
    await modelManager.stopAutoDiscovery()
    
    expect(modelManager.isRunning).toBe(false)
  })

  it('charge les métadonnées d\'un modèle', async () => {
    const mockMetadata = {
      name: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf',
      size: 4294967296,
      format: 'GGUF',
      architecture: 'qwen2',
      parameters: 7000000000,
      context_length: 32768
    }
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      })
    )
    
    const metadata = await modelManager.loadModelMetadata('/models/test.gguf')
    
    expect(metadata).toEqual(mockMetadata)
    expect(global.fetch).toHaveBeenCalledWith('/api/models/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/models/test.gguf' })
    })
  })

  it('gère les erreurs de chargement de métadonnées', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Failed to load metadata'))
    )
    
    await expect(modelManager.loadModelMetadata('/models/test.gguf'))
      .rejects.toThrow('Failed to load metadata')
  })

  it('analyse la compatibilité d\'un modèle', () => {
    const compatibleModel = {
      architecture: 'llama',
      parameters: 7000000000,
      format: 'GGUF'
    }
    
    const incompatibleModel = {
      architecture: 'unknown',
      parameters: -1,
      format: 'GGUF'
    }
    
    expect(modelManager.isModelCompatible(compatibleModel)).toBe(true)
    expect(modelManager.isModelCompatible(incompatibleModel)).toBe(false)
  })

  it('calcule les statistiques du modèle', () => {
    const model = {
      name: 'test-model.gguf',
      size: 4294967296, // 4GB
      parameters: 7000000000, // 7B
      architecture: 'llama'
    }
    
    const stats = modelManager.calculateModelStats(model)
    
    expect(stats.sizeGB).toBe(4)
    expect(stats.parametersBillion).toBe(7)
    expect(stats.compatibility).toBe('good') // llama + reasonable size
  })

  it('détecte automatiquement les formats de modèle', () => {
    const testModels = [
      { name: 'model1.gguf', expected: 'GGUF' },
      { name: 'model2.bin', expected: 'Safetensors' },
      { name: 'model3.safetensors', expected: 'Safetensors' },
      { name: 'model4.ggml', expected: 'GGML' }
    ]
    
    testModels.forEach(({ name, expected }) => {
      const detectedFormat = modelManager.detectModelFormat(name)
      expect(detectedFormat).toBe(expected)
    })
  })

  it('organise les modèles par catégorie', async () => {
    const mockModels = [
      { name: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf', architecture: 'qwen2', parameters: 7000000000 },
      { name: 'llama-3.1-8B-Instruct-Q4_K_M.gguf', architecture: 'llama', parameters: 8000000000 },
      { name: 'mistral-7B-instruct-v0.2.gguf', architecture: 'mistral', parameters: 7000000000 }
    ]
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ models: mockModels })
      })
    )
    
    await modelManager.discoverModels()
    
    const categories = modelManager.organizeModelsByCategory()
    
    expect(categories.qwen2).toHaveLength(1)
    expect(categories.llama).toHaveLength(1)
    expect(categories.mistral).toHaveLength(1)
  })

  it('filtre les modèles selon les critères', async () => {
    const mockModels = [
      { name: 'tiny-model.gguf', parameters: 1000000000, architecture: 'llama', size: 1073741824 }, // 1B
      { name: 'huge-model.gguf', parameters: 70000000000, architecture: 'llama', size: 42949672960 }, // 70B
      { name: 'medium-model.gguf', parameters: 7000000000, architecture: 'llama', size: 4294967296 } // 7B
    ]
    
    const tinyFilter = modelManager.filterModels(mockModels, { maxParameters: 2000000000 })
    expect(tinyFilter).toHaveLength(1)
    expect(tinyFilter[0].name).toBe('tiny-model.gguf')
    
    const hugeFilter = modelManager.filterModels(mockModels, { minParameters: 10000000000 })
    expect(hugeFilter).toHaveLength(1)
    expect(hugeFilter[0].name).toBe('huge-model.gguf')
  })

  it('suggère les meilleurs modèles selon les ressources', () => {
    const mockModels = [
      { name: 'efficient-model.gguf', parameters: 7000000000, performance_score: 9.2 },
      { name: 'heavy-model.gguf', parameters: 70000000000, performance_score: 9.8 },
      { name: 'light-model.gguf', parameters: 1000000000, performance_score: 8.5 }
    ]
    
    const suggestions = modelManager.suggestModels(mockModels, { 
      availableRAM: 8192, // 8GB
      maxModelSize: 2147483648 // 2GB
    })
    
    expect(suggestions).toHaveLength(2)
    expect(suggestions.map(s => s.name)).toContain('efficient-model.gguf')
    expect(suggestions.map(s => s.name)).toContain('light-model.gguf')
    expect(suggestions).not.toContain(expect.objectContaining({ name: 'heavy-model.gguf' }))
  })

  it('valide la structure des modèles', () => {
    const validModel = {
      name: 'test.gguf',
      path: '/models/test.gguf',
      size: 1024000000,
      architecture: 'llama',
      format: 'GGUF'
    }
    
    const invalidModel = {
      name: '', // Empty name
      path: '', // Empty path
      size: -1, // Negative size
      architecture: 'invalid', // Invalid architecture
      format: 'INVALID' // Invalid format
    }
    
    expect(modelManager.validateModelStructure(validModel)).toBe(true)
    expect(modelManager.validateModelStructure(invalidModel)).toBe(false)
  })

  it('gère le cache des métadonnées', async () => {
    const mockMetadata = { name: 'test.gguf', size: 1024000000 }
    
    // First call should fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      })
    )
    
    await modelManager.loadModelMetadata('/models/test.gguf')
    await modelManager.loadModelMetadata('/models/test.gguf') // Second call should use cache
    
    expect(global.fetch).toHaveBeenCalledTimes(1) // Only called once due to caching
    
    const cached = modelManager.getCachedMetadata('/models/test.gguf')
    expect(cached).toEqual(mockMetadata)
  })

  it('invalide le cache quand nécessaire', () => {
    const mockMetadata = { name: 'test.gguf', size: 1024000000 }
    modelManager.metadataCache.set('/models/test.gguf', mockMetadata)
    
    modelManager.invalidateMetadataCache('/models/test.gguf')
    
    expect(modelManager.metadataCache.has('/models/test.gguf')).toBe(false)
  })

  it('exporte la liste des modèles', () => {
    const mockModels = [
      { name: 'model1.gguf', path: '/models/model1.gguf', size: 1024000000 },
      { name: 'model2.gguf', path: '/models/model2.gguf', size: 2048000000 }
    ]
    
    modelManager.discoveredModels = mockModels
    
    const exportData = modelManager.exportModelList()
    
    expect(exportData).toEqual({
      timestamp: expect.any(Number),
      totalModels: 2,
      totalSize: 3072000000,
      models: mockModels
    })
  })

  it('importe une liste de modèles', () => {
    const importData = {
      timestamp: Date.now(),
      totalModels: 2,
      models: [
        { name: 'imported1.gguf', path: '/import/imported1.gguf', size: 1024000000 },
        { name: 'imported2.gguf', path: '/import/imported2.gguf', size: 2048000000 }
      ]
    }
    
    modelManager.importModelList(importData)
    
    expect(modelManager.discoveredModels).toHaveLength(2)
    expect(modelManager.discoveredModels[0].name).toBe('imported1.gguf')
  })

  it('nettoie le cache automatiquement', () => {
    // Fill cache with old entries
    const oldDate = Date.now() - (1000 * 60 * 60 * 24 * 2) // 2 days ago
    for (let i = 0; i < 100; i++) {
      modelManager.metadataCache.set(`model${i}`, { name: `model${i}` }, oldDate)
    }
    
    modelManager.cleanMetadataCache(24) // 1 day TTL
    
    // Should clean old entries
    expect(modelManager.metadataCache.size).toBeLessThan(100)
  })

  it('destroy nettoie toutes les ressources', async () => {
    await modelManager.startAutoDiscovery()
    modelManager.metadataCache.set('test', { name: 'test' })
    
    modelManager.destroy()
    
    expect(modelManager.isRunning).toBe(false)
    expect(modelManager.metadataCache.size).toBe(0)
  })
})