import { render, screen } from '@testing-library/react'
import React from 'react'

import ErrorBoundary from '../../components/ErrorBoundary'
import { registerErrorTelemetry, flushErrorTelemetryForTests } from '../../utils/errorTelemetry'

function Boom() { throw new Error('Kaboom 42') }

describe('ErrorBoundary', () => {
  let originalError
  beforeAll(() => {
    // Silence React error boundary noise for this suite only
    originalError = console.error
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })
  
  afterEach(() => {
    // Clean up any pending telemetry
    registerErrorTelemetry(null)
  })
  
  it('renders fallback UI and dispatches telemetry on error', () => {
    const events = []
    registerErrorTelemetry(p => events.push(p))
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Ein Fehler ist aufgetreten/)).toBeInTheDocument()
    
    // Flush the debounced telemetry queue
    flushErrorTelemetryForTests()
    
    // Telemetry captured in batch format
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('batch')
    expect(events[0].count).toBe(1)
    expect(events[0].errors[0].message).toMatch(/Kaboom 42/)
  })
})
