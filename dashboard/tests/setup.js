import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

// Mock Element Plus globally
global.ElementPlus = {
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve()),
    alert: vi.fn(() => Promise.resolve())
  },
  ElNotification: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}

// Mock Chart.js globally
global.Chart = vi.fn().mockImplementation(() => ({
  destroy: vi.fn(),
  update: vi.fn(),
  render: vi.fn()
}))

// Mock Web APIs
global.fetch = vi.fn()
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1
}))

// Mock File API
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}))

// Mock clipboard API
global.navigator = {
  ...global.navigator,
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
}

// Setup testing environment before each test
beforeAll(() => {
  // Create testing instance
  createTestingPinia({
    initialPiniaState: {
      // Add any initial state needed for testing
    }
  })
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks()
})