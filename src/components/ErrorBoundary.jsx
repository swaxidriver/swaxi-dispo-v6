import { Component } from 'react'

import { logError } from '../utils/logger'
import { dispatchErrorTelemetry } from '../utils/errorTelemetry'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    const payload = {
      message: error?.message || String(error),
      stack: error?.stack,
      componentStack: info?.componentStack,
      time: new Date().toISOString(),
      version: '6.0.1'
    }
  logError('ErrorBoundary captured error', payload)
  try { dispatchErrorTelemetry(payload) } catch (e) { logError('Telemetry handler failed', e) }
  }
  handleReload = () => {
    window.location.reload()
  }
  render() {
    const { error } = this.state
    if (error) {
      return (
        <div role="alert" className="p-6 text-red-700 bg-red-50 rounded">
          <h2 className="font-semibold mb-2">Ein Fehler ist aufgetreten</h2>
          <pre className="text-xs whitespace-pre-wrap">{String(error.message || error)}</pre>
          <button className="mt-3 btn btn-primary px-3 py-1" onClick={this.handleReload}>Neu laden</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
