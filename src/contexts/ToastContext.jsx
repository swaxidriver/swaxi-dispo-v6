import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// Toast notification context for ephemeral notifications with aria-live support
// Shape: { id, message, type: 'success'|'error'|'info'|'warning', duration, isVisible }

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, { type = 'info', duration = 5000, persistent = false } = {}) => {
    if (!message || !message.trim()) return { ok: false, reason: 'empty' }
    
    const toast = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      message: message.trim(),
      type,
      duration,
      persistent,
      timestamp: Date.now(),
      isVisible: true
    }
    
    setToasts(prev => [...prev, toast])
    
    // Auto-remove non-persistent toasts
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, duration)
    }
    
    return { ok: true, id: toast.id }
  }, [removeToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const value = useMemo(() => ({ 
    toasts, 
    addToast, 
    removeToast, 
    clearAll 
  }), [toasts, addToast, removeToast, clearAll])

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastContext