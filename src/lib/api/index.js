/**
 * API and Service Utilities
 * 
 * Common utilities for API interactions and service operations
 */

/**
 * Simple HTTP client wrapper
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise} Response promise
 */
export async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }
  
  const response = await fetch(url, { ...defaultOptions, ...options })
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Create a debounced function for API calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves when function succeeds or max retries reached
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Create a response cache for API calls
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Object} Cache object with get/set/clear methods
 */
export function createResponseCache(ttl = 5 * 60 * 1000) { // 5 minutes default
  const cache = new Map()
  
  return {
    get(key) {
      const entry = cache.get(key)
      if (!entry) return null
      
      if (Date.now() > entry.expiry) {
        cache.delete(key)
        return null
      }
      
      return entry.data
    },
    
    set(key, data) {
      cache.set(key, {
        data,
        expiry: Date.now() + ttl
      })
    },
    
    clear() {
      cache.clear()
    },
    
    delete(key) {
      cache.delete(key)
    }
  }
}

/**
 * Format error for user display
 * @param {Error} error - Error to format
 * @returns {string} User-friendly error message
 */
export function formatApiError(error) {
  if (error.message.includes('fetch')) {
    return 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.'
  }
  
  if (error.message.includes('401')) {
    return 'Nicht autorisiert. Bitte melden Sie sich erneut an.'
  }
  
  if (error.message.includes('403')) {
    return 'Zugriff verweigert. Sie haben nicht die erforderlichen Berechtigungen.'
  }
  
  if (error.message.includes('404')) {
    return 'Die angeforderte Ressource wurde nicht gefunden.'
  }
  
  if (error.message.includes('500')) {
    return 'Serverfehler. Bitte versuchen Sie es später erneut.'
  }
  
  return error.message || 'Ein unbekannter Fehler ist aufgetreten.'
}

/**
 * Validate API response structure
 * @param {any} response - Response to validate
 * @param {Object} schema - Expected schema
 * @returns {boolean} True if response matches schema
 */
export function validateApiResponse(response, schema) {
  if (!response || typeof response !== 'object') {
    return false
  }
  
  for (const [key, expectedType] of Object.entries(schema)) {
    if (!(key in response)) {
      return false
    }
    
    if (typeof response[key] !== expectedType) {
      return false
    }
  }
  
  return true
}