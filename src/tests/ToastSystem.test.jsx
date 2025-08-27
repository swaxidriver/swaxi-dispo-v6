import { render, screen, fireEvent } from '@testing-library/react'

import { ToastProvider } from '../contexts/ToastContext'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../contexts/useToast'

// Test component to trigger toast
function TestToastTrigger() {
  const { addToast, clearAll } = useToast()
  
  return (
    <div>
      <button 
        onClick={() => addToast('Test success message', { type: 'success' })}
        data-testid="success-btn"
      >
        Success Toast
      </button>
      <button 
        onClick={() => addToast('Test error message', { type: 'error' })}
        data-testid="error-btn"
      >
        Error Toast
      </button>
      <button 
        onClick={() => addToast('Test info message', { type: 'info' })}
        data-testid="info-btn"
      >
        Info Toast
      </button>
      <button 
        onClick={() => clearAll()}
        data-testid="clear-btn"
      >
        Clear All
      </button>
    </div>
  )
}

const renderWithToast = () => {
  return render(
    <ToastProvider>
      <TestToastTrigger />
      <ToastContainer />
    </ToastProvider>
  )
}

describe('Toast System', () => {
  it('displays success toast message', () => {
    renderWithToast()
    
    fireEvent.click(screen.getByTestId('success-btn'))
    
    expect(screen.getByText('Test success message')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('displays error toast with alert role', () => {
    renderWithToast()
    
    fireEvent.click(screen.getByTestId('error-btn'))
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('displays info toast message', () => {
    renderWithToast()
    
    fireEvent.click(screen.getByTestId('info-btn'))
    
    expect(screen.getByText('Test info message')).toBeInTheDocument()
  })

  it('allows dismissing toast messages', () => {
    renderWithToast()
    
    fireEvent.click(screen.getByTestId('success-btn'))
    expect(screen.getByText('Test success message')).toBeInTheDocument()
    
    const dismissBtn = screen.getByLabelText('Benachrichtigung schließen')
    fireEvent.click(dismissBtn)
    
    expect(screen.queryByText('Test success message')).not.toBeInTheDocument()
  })

  it('clears all toasts', () => {
    renderWithToast()
    
    fireEvent.click(screen.getByTestId('success-btn'))
    fireEvent.click(screen.getByTestId('info-btn'))
    
    expect(screen.getByText('Test success message')).toBeInTheDocument()
    expect(screen.getByText('Test info message')).toBeInTheDocument()
    
    fireEvent.click(screen.getByTestId('clear-btn'))
    
    expect(screen.queryByText('Test success message')).not.toBeInTheDocument()
    expect(screen.queryByText('Test info message')).not.toBeInTheDocument()
  })

  it('throws error when useToast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => render(<TestToastTrigger />)).toThrow(
      'useToast must be used within ToastProvider'
    )
    
    consoleSpy.mockRestore()
  })
})