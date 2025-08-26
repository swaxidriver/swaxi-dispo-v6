import { render, screen, fireEvent, act, within } from '@testing-library/react'
import AuthContext from '../contexts/AuthContext'
import { ShiftProvider } from '../contexts/ShiftContext'
import { ThemeProvider } from '../contexts/ThemeContext'

/**
 * Unified test render with common providers.
 * Options:
 *  - authUser: { name, role }
 *  - shiftOverrides: function to run after initial render for additional state tweaks (receives window.localStorage or dispatch via custom TODO)
 */
export function renderWithProviders(ui, { authUser = { name: 'Tester', role: 'admin' }, ...renderOptions } = {}) {
  return render(
    <AuthContext.Provider value={{ user: authUser }}>
      <ThemeProvider>
        <ShiftProvider>
          {ui}
        </ShiftProvider>
      </ThemeProvider>
    </AuthContext.Provider>,
    renderOptions
  )
}

// Re-export RTL helpers for convenience
export { render, screen, fireEvent, act, within }
