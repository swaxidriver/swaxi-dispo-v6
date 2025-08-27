import { useState, useCallback } from 'react'

import { logError } from '../utils/logger'

/**
 * Custom hook for managing async operations with loading and error states
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 * @param {boolean} options.logErrors - Whether to log errors (default: true)
 * @param {Function} options.onSuccess - Callback executed on success
 * @param {Function} options.onError - Callback executed on error
 * @returns {Object} - { execute, isLoading, error, clearError }
 */
export function useAsyncOperation(asyncFn, options = {}) {
  const { logErrors = true, onSuccess, onError } = options
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const execute = useCallback(async (...args) => {
    if (isLoading) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await asyncFn(...args)
      onSuccess?.(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      
      if (logErrors) {
        logError('Async operation failed:', err)
      }
      
      onError?.(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [asyncFn, isLoading, logErrors, onSuccess, onError])

  return {
    execute,
    isLoading,
    error,
    clearError
  }
}

/**
 * Hook for managing form state with validation
 * @param {Object} initialState - Initial form values
 * @param {Function} validator - Function to validate form data
 * @returns {Object} - Form state management utilities
 */
export function useFormState(initialState = {}, validator = null) {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [errors])

  const setTouchedField = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const validate = useCallback(() => {
    if (!validator) return true
    
    const validationErrors = validator(values)
    setErrors(validationErrors || {})
    
    return Object.keys(validationErrors || {}).length === 0
  }, [values, validator])

  const reset = useCallback(() => {
    setValues(initialState)
    setErrors({})
    setTouched({})
  }, [initialState])

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setValue(name, type === 'checkbox' ? checked : value)
  }, [setValue])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouchedField(name)
    
    if (validator) {
      const fieldErrors = validator({ ...values, [name]: values[name] })
      if (fieldErrors[name]) {
        setErrors(prev => ({ ...prev, [name]: fieldErrors[name] }))
      }
    }
  }, [values, validator, setTouchedField])

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched: setTouchedField,
    validate,
    reset,
    handleInputChange,
    handleBlur,
    isValid: Object.keys(errors).length === 0
  }
}

/**
 * Hook for managing local storage with JSON serialization
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {Array} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, defaultValue = null) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      logError('Failed to read from localStorage:', error)
      return defaultValue
    }
  })

  const setStoredValue = useCallback((newValue) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue))
      setValue(newValue)
    } catch (error) {
      logError('Failed to write to localStorage:', error)
      // Don't update state if localStorage fails
    }
  }, [key])

  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue)
      localStorage.removeItem(key)
    } catch (error) {
      logError('Failed to remove from localStorage:', error)
    }
  }, [key, defaultValue])

  return [value, setStoredValue, removeValue]
}

export default {
  useAsyncOperation,
  useFormState,
  useLocalStorage
}