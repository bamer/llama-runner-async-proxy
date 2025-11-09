/**
 * Debounce utility function
 * Delays function execution until after a specified time period has elapsed
 */

export function debounce(func, delay = 300, immediate = false) {
  let timeoutId
  
  return function executedFunction(...args) {
    const later = () => {
      timeoutId = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeoutId
    
    clearTimeout(timeoutId)
    timeoutId = setTimeout(later, delay)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle utility function
 * Ensures function is called at most once in a specified time period
 */

export function throttle(func, delay = 300) {
  let lastCall = 0
  
  return function executedFunction(...args) {
    const now = Date.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * Deep clone utility
 * Creates a deep copy of objects and arrays
 */

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * Deep merge utility
 * Merges objects recursively
 */

export function deepMerge(target, source) {
  const result = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  
  return result
}

/**
 * Format bytes to human readable string
 */

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format duration in milliseconds to human readable string
 */

export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Generate unique ID
 */

export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substr(2, 5)
  return `${prefix}${timestamp}_${randomStr}`
}

/**
 * Sleep/delay function
 */

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 */

export async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, i)
      console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms delay`)
      await sleep(delay)
    }
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */

export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Capitalize first letter of string
 */

export function capitalize(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert camelCase to snake_case
 */

export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Convert snake_case to camelCase
 */

export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Validate email format
 */

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */

export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Get file extension from filename or path
 */

export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * Check if running in browser environment
 */

export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Check if running in development mode
 */

export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production mode
 */

export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * Local storage wrapper with error handling
 */

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error)
      return defaultValue
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error)
      return false
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
      return false
    }
  },
  
  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
      return false
    }
  }
}

/**
 * Session storage wrapper with error handling
 */

export const sessionStorage = {
  get(key, defaultValue = null) {
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn(`Error reading from sessionStorage key "${key}":`, error)
      return defaultValue
    }
  },
  
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Error writing to sessionStorage key "${key}":`, error)
      return false
    }
  },
  
  remove(key) {
    try {
      window.sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
      return false
    }
  }
}

/**
 * Event emitter class for custom events
 */

export class EventEmitter {
  constructor() {
    this.events = {}
  }
  
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = new Set()
    }
    this.events[event].add(listener)
    
    // Return unsubscribe function
    return () => this.off(event, listener)
  }
  
  off(event, listener) {
    if (this.events[event]) {
      this.events[event].delete(listener)
      if (this.events[event].size === 0) {
        delete this.events[event]
      }
    }
  }
  
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error)
        }
      })
    }
  }
  
  once(event, listener) {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe()
      listener(...args)
    })
    return unsubscribe
  }
  
  removeAllListeners(event) {
    if (event) {
      delete this.events[event]
    } else {
      this.events = {}
    }
  }
}