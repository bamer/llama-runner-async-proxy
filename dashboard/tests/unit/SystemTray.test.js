import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import SystemTray from '@/js/SystemTray.js'

// Mock Web APIs
Object.defineProperty(window, 'Notification', {
  value: vi.fn().mockImplementation((title, options) => ({
    title,
    options,
    onclick: null,
    close: vi.fn()
  }))
})

Object.defineProperty(document, 'title', {
  writable: true,
  value: 'Original Title'
})

describe('SystemTray', () => {
  let systemTray
  let mockElement

  beforeEach(() => {
    // Mock DOM elements
    mockElement = {
      style: {
        display: '',
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#333',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: '9999'
      },
      className: '',
      textContent: '',
      innerHTML: '',
      onclick: null,
      oncontextmenu: null,
      remove: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      dispatchEvent: vi.fn()
    }

    global.document.createElement = vi.fn(() => mockElement)
    global.document.body = {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }

    systemTray = new SystemTray()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initialise le system tray correctement', () => {
    expect(systemTray.isInitialized).toBe(true)
    expect(systemTray.notificationsEnabled).toBe(true)
  })

  it('affiche une notification', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    
    systemTray.showNotification('Test Title', 'Test Message')
    
    expect(consoleSpy).toHaveBeenCalledWith('SystemTray Notification:', 'Test Title', 'Test Message')
    consoleSpy.mockRestore()
  })

  it('met à jour le badge du tray', () => {
    systemTray.updateBadge(5)
    
    expect(mockElement.textContent).toContain('5')
    expect(mockElement.className).toContain('has-notifications')
  })

  it('cache le badge quand il n\'y a pas de notifications', () => {
    systemTray.updateBadge(0)
    
    expect(mockElement.className).not.toContain('has-notifications')
  })

  it('crée un menu contextuel au clic droit', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 100,
      clientY: 200
    }

    systemTray.createContextMenu(mockEvent)
    
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(global.document.createElement).toHaveBeenCalled()
  })

  it('gère les clics sur les éléments du menu', async () => {
    const mockMenuItem = {
      onclick: vi.fn(),
      textContent: 'Afficher les Modèles',
      style: {}
    }

    global.document.createElement = vi.fn(() => ({
      style: {},
      onclick: null,
      appendChild: vi.fn(),
      remove: vi.fn(),
      dispatchEvent: vi.fn()
    })).mockReturnValueOnce(mockMenuItem)

    const clickHandler = vi.fn()
    systemTray.on('show-models', clickHandler)
    
    systemTray.createContextMenu({ preventDefault: vi.fn(), clientX: 100, clientY: 200 })
    
    // Simulate menu item click
    mockMenuItem.onclick()
    
    // The menu creation should be called
    expect(global.document.createElement).toHaveBeenCalled()
  })

  it('masque le menu contextuel', () => {
    systemTray.showMenu = mockElement
    
    systemTray.hideContextMenu()
    
    expect(mockElement.style.display).toBe('none')
  })

  it('affich un indicateur de statut', () => {
    systemTray.showStatus('connected', 'Connecté')
    
    expect(mockElement.style.background).toBe('#28a745') // Green for connected
    expect(mockElement.textContent).toContain('Connecté')
  })

  it('affiche une erreur en rouge', () => {
    systemTray.showStatus('error', 'Erreur de connexion')
    
    expect(mockElement.style.background).toBe('#dc3545') // Red for error
    expect(mockElement.textContent).toContain('Erreur de connexion')
  })

  it('crée un sous-menu', () => {
    const mockSubMenu = {
      style: {},
      onclick: vi.fn()
    }
    
    global.document.createElement = vi.fn(() => mockSubMenu)

    const subMenu = systemTray.createSubMenu('Modèles')
    
    expect(subMenu.style).toEqual(expect.objectContaining({
      background: 'transparent',
      marginLeft: '20px'
    }))
  })

  it('gère le minimum du dashboard', () => {
    systemTray.minimizeToTray()
    
    expect(document.title).toBe('Llama Runner (Minimized)')
    expect(mockElement.style.display).toBe('')
  })

  it('gère la restauration du dashboard', () => {
    systemTray.minimizeToTray()
    systemTray.restoreFromTray()
    
    expect(document.title).toBe('Original Title')
  })

  it('ajoute et supprime des event listeners', () => {
    const handler = vi.fn()
    
    systemTray.on('test-event', handler)
    systemTray.emit('test-event', { data: 'test' })
    
    expect(handler).toHaveBeenCalledWith({ data: 'test' })
    
    systemTray.off('test-event', handler)
    systemTray.emit('test-event', { data: 'test2' })
    
    expect(handler).not.toHaveBeenCalledWith({ data: 'test2' })
  })

  it('crée un bouton d\'action rapide', () => {
    const actionHandler = vi.fn()
    
    const button = systemTray.createQuickAction('Nouveau Modèle', actionHandler)
    
    expect(button.textContent).toContain('Nouveau Modèle')
    expect(typeof button.onclick).toBe('function')
  })

  it('gère les notifications avec audio', () => {
    const audioMock = {
      play: vi.fn().mockResolvedValue(undefined)
    }
    
    global.Audio = vi.fn(() => audioMock)
    
    systemTray.enableSoundNotifications(true)
    systemTray.playNotificationSound()
    
    expect(audioMock.play).toHaveBeenCalled()
  })

  it('ajoute une animation au badge', () => {
    systemTray.animateBadge()
    
    expect(mockElement.className).toContain('pulse-animation')
  })

  it('nettoie les ressources', () => {
    systemTray.destroy()
    
    expect(mockElement.remove).toHaveBeenCalled()
    expect(systemTray.isInitialized).toBe(false)
  })

  it('exporte la configuration du tray', () => {
    systemTray.updateBadge(3)
    systemTray.showStatus('connected', 'Test')
    
    const config = systemTray.exportConfig()
    
    expect(config).toEqual(expect.objectContaining({
      notificationsEnabled: true,
      currentBadge: 3,
      status: 'connected'
    }))
  })

  it('importe une configuration du tray', () => {
    const config = {
      notificationsEnabled: false,
      position: { x: 100, y: 200 },
      theme: 'dark'
    }
    
    systemTray.importConfig(config)
    
    expect(systemTray.notificationsEnabled).toBe(false)
  })
})