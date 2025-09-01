import { useState, useCallback } from "react";

import { logError } from "../utils/logger";

/**
 * Custom hook for managing async operations with loading, error states, and retry capabilities
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Configuration options
 * @param {boolean} options.logErrors - Whether to log errors (default: true)
 * @param {Function} options.onSuccess - Callback executed on success
 * @param {Function} options.onError - Callback executed on error
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Object} - { execute, retry, isLoading, error, clearError, retryCount, canRetry }
 */
export function useAsyncOperation(asyncFn, options = {}) {
  const {
    logErrors = true,
    onSuccess,
    onError,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastArgs, setLastArgs] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setLastArgs(null);
  }, []);

  const executeInternal = useCallback(
    async (args, isRetry = false) => {
      if (isLoading && !isRetry) return null;

      setIsLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
        setLastArgs(args);
      }

      try {
        const result = await asyncFn(...args);
        // Reset retry state on success
        setRetryCount(0);
        setLastArgs(null);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);

        if (logErrors) {
          logError("Async operation failed:", err);
        }

        onError?.(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn, isLoading, logErrors, onSuccess, onError],
  );

  const execute = useCallback(
    async (...args) => {
      return executeInternal(args, false);
    },
    [executeInternal],
  );

  const retry = useCallback(async () => {
    if (!lastArgs || retryCount >= maxRetries || isLoading) {
      return null;
    }

    setRetryCount((prev) => prev + 1);

    // Add delay before retry
    if (retryDelay > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * retryCount),
      );
    }

    try {
      return await executeInternal(lastArgs, true);
    } catch (_err) {
      // Error is already handled in executeInternal
      return null;
    }
  }, [
    lastArgs,
    retryCount,
    maxRetries,
    isLoading,
    retryDelay,
    executeInternal,
  ]);

  const canRetry = lastArgs && retryCount < maxRetries && !isLoading;

  return {
    execute,
    retry,
    isLoading,
    error,
    clearError,
    retryCount,
    canRetry,
  };
}

/**
 * Hook for managing form state with validation
 * @param {Object} initialState - Initial form values
 * @param {Function} validator - Function to validate form data
 * @returns {Object} - Form state management utilities
 */
export function useFormState(initialState = {}, validator = null) {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: null }));
      }
    },
    [errors],
  );

  const setTouchedField = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(() => {
    if (!validator) return true;

    const validationErrors = validator(values);
    setErrors(validationErrors || {});

    return Object.keys(validationErrors || {}).length === 0;
  }, [values, validator]);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setValue(name, type === "checkbox" ? checked : value);
    },
    [setValue],
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouchedField(name);

      if (validator) {
        const fieldErrors = validator({ ...values, [name]: values[name] });
        if (fieldErrors[name]) {
          setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
        }
      }
    },
    [values, validator, setTouchedField],
  );

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
    isValid: Object.keys(errors).length === 0,
  };
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
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logError("Failed to read from localStorage:", error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue) => {
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
        setValue(newValue);
      } catch (error) {
        logError("Failed to write to localStorage:", error);
        // Don't update state if localStorage fails
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue);
      localStorage.removeItem(key);
    } catch (error) {
      logError("Failed to remove from localStorage:", error);
    }
  }, [key, defaultValue]);

  return [value, setStoredValue, removeValue];
}

export { useMobileDevice, useTimeInputStep } from "./useMobileDevice";

export default {
  useAsyncOperation,
  useFormState,
  useLocalStorage,
};
