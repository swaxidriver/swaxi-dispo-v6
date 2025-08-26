import { render, screen, fireEvent } from '@testing-library/react'

import { ThemeProvider } from '../contexts/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

// Simple helper to render with ThemeProvider only (no auth/shift needed)
function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('ThemeToggle', () => {
  test('renders moon icon initially (light mode) and toggles to sun icon (dark mode)', () => {
    renderWithTheme(<ThemeToggle />)

    // Initial state: light -> moon icon visible
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /toggle theme/i })
    fireEvent.click(btn)

    // After toggle: dark -> sun icon visible
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
  })

  test('sets data-theme attribute on documentElement when toggled', () => {
    renderWithTheme(<ThemeToggle />)
    const btn = screen.getByRole('button', { name: /toggle theme/i })

    // Starts as light
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.click(btn)
    expect(document.documentElement.dataset.theme).toBe('dark')

    fireEvent.click(btn)
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
