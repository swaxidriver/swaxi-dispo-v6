/**
 * Form validation utilities with toast notifications and retry capabilities
 * Provides inline errors, toast feedback, and never-lose-state form handling
 */

/**
 * Toast notification utilities using existing aria-live region
 */
export const toast = {
  /**
   * Show a success toast message
   * @param {string} message - Success message to display
   * @param {number} duration - Duration in ms (default: 4000)
   */
  success(message, duration = 4000) {
    this._announce(message, 'success', duration)
  },

  /**
   * Show an error toast message
   * @param {string} message - Error message to display
   * @param {number} duration - Duration in ms (default: 6000)
   */
  error(message, duration = 6000) {
    this._announce(message, 'error', duration)
  },

  /**
   * Show an info toast message
   * @param {string} message - Info message to display
   * @param {number} duration - Duration in ms (default: 4000)
   */
  info(message, duration = 4000) {
    this._announce(message, 'info', duration)
  },

  /**
   * Internal method to announce messages via aria-live region
   * @param {string} message - Message to announce
   * @param {string} type - Type of message (success, error, info)
   * @param {number} duration - Duration to show message
   */
  _announce(message, type, duration) {
    const ariaLiveRegion = document.getElementById('aria-live-root')
    if (!ariaLiveRegion) return

    // Create toast element for visual display
    const toastContainer = this._getOrCreateToastContainer()
    const toastElement = this._createToastElement(message, type)
    toastContainer.appendChild(toastElement)

    // Announce to screen readers via aria-live region
    ariaLiveRegion.textContent = message

    // Auto-remove toast after duration
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.remove()
      }
      // Clear aria-live region if it still contains this message
      if (ariaLiveRegion.textContent === message) {
        ariaLiveRegion.textContent = ''
      }
    }, duration)
  },

  /**
   * Get or create the visual toast container
   * @returns {HTMLElement} Toast container element
   */
  _getOrCreateToastContainer() {
    let container = document.getElementById('toast-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'toast-container'
      container.className = 'fixed top-4 right-4 z-50 space-y-2'
      container.setAttribute('aria-hidden', 'true') // Visual only, aria-live handles announcements
      document.body.appendChild(container)
    }
    return container
  },

  /**
   * Create a visual toast element
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, info)
   * @returns {HTMLElement} Toast element
   */
  _createToastElement(message, type) {
    const toast = document.createElement('div')
    
    const baseClasses = 'px-4 py-3 rounded-md shadow-lg text-sm font-medium animate-slide-in-right'
    const typeClasses = {
      success: 'bg-green-100 text-green-800 border border-green-200',
      error: 'bg-red-100 text-red-800 border border-red-200',
      info: 'bg-blue-100 text-blue-800 border border-blue-200'
    }
    
    toast.className = `${baseClasses} ${typeClasses[type] || typeClasses.info}`
    toast.textContent = message
    
    // Add close button
    const closeButton = document.createElement('button')
    closeButton.innerHTML = '×'
    closeButton.className = 'ml-2 text-lg leading-none hover:opacity-70 focus:outline-none'
    closeButton.setAttribute('aria-label', 'Schließen')
    closeButton.onclick = () => toast.remove()
    
    toast.appendChild(closeButton)
    
    return toast
  }
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (value, fieldName = 'Feld') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} ist erforderlich`
    }
    return null
  },
  
  email: (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein'
    }
    return null
  },
  
  minLength: (min) => (value, fieldName = 'Feld') => {
    if (value && value.length < min) {
      return `${fieldName} muss mindestens ${min} Zeichen lang sein`
    }
    return null
  },
  
  time: (value) => {
    if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      return 'Bitte geben Sie eine gültige Uhrzeit ein (HH:MM)'
    }
    return null
  },
  
  date: (value) => {
    if (value && isNaN(Date.parse(value))) {
      return 'Bitte geben Sie ein gültiges Datum ein'
    }
    return null
  }
}

/**
 * Create a composite validator from multiple rules
 * @param {Object} fieldRules - Object mapping field names to validation rules
 * @returns {Function} Validator function
 */
export function createValidator(fieldRules) {
  return (values) => {
    const errors = {}
    
    Object.entries(fieldRules).forEach(([fieldName, rules]) => {
      const fieldValue = values[fieldName]
      const ruleArray = Array.isArray(rules) ? rules : [rules]
      
      for (const rule of ruleArray) {
        const error = typeof rule === 'function' ? rule(fieldValue, fieldName) : null
        if (error) {
          errors[fieldName] = error
          break // Stop at first error for this field
        }
      }
    })
    
    return errors
  }
}

/**
 * Enhanced form submit handler with persistence and retry
 * @param {Object} formState - Form state from useFormState hook
 * @param {Function} submitFn - Async function to handle form submission
 * @param {Object} options - Submit options
 * @returns {Function} Enhanced submit handler
 */
export function createFormSubmitHandler(formState, submitFn, options = {}) {
  const {
    persistKey,
    showSuccessToast = true,
    successMessage = 'Erfolgreich gespeichert!',
    clearOnSuccess = false,
    onSuccess,
    onError
  } = options

  return async (e) => {
    if (e) e.preventDefault()

    // Validate form first
    const isValid = formState.validate()
    if (!isValid) {
      toast.error('Bitte überprüfen Sie Ihre Eingaben')
      return { success: false, error: 'Validation failed' }
    }

    try {
      const result = await submitFn(formState.values)

      // Clear persisted form data on success
      if (persistKey && clearOnSuccess) {
        localStorage.removeItem(`form-${persistKey}`)
      }

      // Show success feedback
      if (showSuccessToast) {
        toast.success(successMessage)
      }

      // Call success callback
      onSuccess?.(result)

      // Clear form if requested
      if (clearOnSuccess) {
        formState.reset()
      }

      return { success: true, result }

    } catch (error) {
      const errorMessage = error.message || 'Ein Fehler ist aufgetreten'

      // Show error toast with retry option
      toast.error(`Fehler beim Speichern: ${errorMessage}`)

      // Call error callback
      onError?.(error)

      return { success: false, error: errorMessage }
    }
  }
}

/**
 * Form state persistence utilities
 */
export const formPersistence = {
  /**
   * Save form state to localStorage
   * @param {string} key - Storage key
   * @param {Object} values - Form values to save
   */
  save(key, values) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`form-${key}`, JSON.stringify(values))
      } catch {
        // Ignore persistence errors
      }
    }
  },

  /**
   * Load form state from localStorage
   * @param {string} key - Storage key
   * @param {Object} defaultValues - Default values if nothing saved
   * @returns {Object} Loaded or default values
   */
  load(key, defaultValues = {}) {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`form-${key}`)
        return saved ? { ...defaultValues, ...JSON.parse(saved) } : defaultValues
      } catch {
        return defaultValues
      }
    }
    return defaultValues
  },

  /**
   * Clear saved form state
   * @param {string} key - Storage key
   */
  clear(key) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`form-${key}`)
    }
  }
}