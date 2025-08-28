import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Tooltip from '../components/Tooltip'

describe('Tooltip', () => {
  beforeEach(() => {
    // Reset viewport dimensions for consistent testing
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  it('renders children without tooltip initially', () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Test Button</button>
      </Tooltip>
    )

    expect(screen.getByText('Test Button')).toBeInTheDocument()
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip on mouse enter and hides on mouse leave', async () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Test Button</button>
      </Tooltip>
    )

    const button = screen.getByText('Test Button')
    
    // Hover to show tooltip
    fireEvent.mouseEnter(button)
    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument()
    })

    // Leave to hide tooltip
    fireEvent.mouseLeave(button)
    await waitFor(() => {
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
    })
  })

  it('supports mobile long-press (≥600ms)', async () => {
    jest.useFakeTimers()
    
    render(
      <Tooltip content="Test tooltip">
        <button>Test Button</button>
      </Tooltip>
    )

    const button = screen.getByText('Test Button')
    
    // Start touch
    fireEvent.touchStart(button)
    
    // Advance time to 500ms - should not show tooltip yet
    jest.advanceTimersByTime(500)
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
    
    // Advance to 600ms - should show tooltip
    jest.advanceTimersByTime(100)
    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument()
    })
    
    jest.useRealTimers()
  })

  it('cancels long-press on touch move', async () => {
    jest.useFakeTimers()
    
    render(
      <Tooltip content="Test tooltip">
        <button>Test Button</button>
      </Tooltip>
    )

    const button = screen.getByText('Test Button')
    
    // Start touch
    fireEvent.touchStart(button)
    
    // Move finger - should cancel long-press
    fireEvent.touchMove(button)
    
    // Advance to 600ms - should not show tooltip
    jest.advanceTimersByTime(600)
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
    
    jest.useRealTimers()
  })

  it('sets proper accessibility attributes', async () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Test Button</button>
      </Tooltip>
    )

    const button = screen.getByText('Test Button')
    
    // Should have cursor-help class
    expect(button.parentElement).toHaveClass('cursor-help')
    
    // Hover to show tooltip
    fireEvent.mouseEnter(button)
    
    await waitFor(() => {
      const tooltip = screen.getByText('Test tooltip')
      expect(tooltip).toHaveAttribute('role', 'tooltip')
      expect(button.parentElement).toHaveAttribute('aria-describedby', tooltip.id)
    })
  })

  it('does not show tooltip when disabled', () => {
    render(
      <Tooltip content="Test tooltip" disabled={true}>
        <button>Test Button</button>
      </Tooltip>
    )

    const button = screen.getByText('Test Button')
    
    // Try to hover
    fireEvent.mouseEnter(button)
    
    // Should not show tooltip
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <Tooltip content="Test tooltip" className="custom-class">
        <button>Test Button</button>
      </Tooltip>
    )

    const container = screen.getByText('Test Button').parentElement.parentElement
    expect(container).toHaveClass('custom-class')
  })
})