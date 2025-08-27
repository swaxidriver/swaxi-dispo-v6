import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ENABLE_TELEMETRY } from './config/featureFlags.js'
import { registerErrorTelemetry } from './utils/errorTelemetry.js'

// Register error telemetry handler if enabled
if (ENABLE_TELEMETRY) {
  registerErrorTelemetry((payload) => {
    // Simple remote logging implementation
    // In production, this could send to a logging service
    console.log('📊 Error Telemetry:', payload)
    
    // Example remote logging (commented out)
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).catch(() => {}) // Silent fail for telemetry
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

// Register service worker (PWA) in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
