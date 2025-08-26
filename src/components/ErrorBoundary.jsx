import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    // Basic console log; could be replaced by remote logging later
    console.error('ErrorBoundary caught error', error, info?.componentStack)
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
          <button className="mt-3 bg-brand-primary text-white px-3 py-1 rounded" onClick={this.handleReload}>Neu laden</button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
