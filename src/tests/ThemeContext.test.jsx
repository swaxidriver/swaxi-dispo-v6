import { render, screen, fireEvent } from '@testing-library/react'

import { ThemeProvider } from '../contexts/ThemeContext'
import { ThemeContext } from '../contexts/ThemeContextCore'

function TestThemeToggle() {
  return (
    <ThemeContext.Consumer>
      {({ state, dispatch }) => (
        <button data-testid="theme-btn" onClick={() => dispatch({ type: 'TOGGLE_THEME' })}>
          {state.isDark ? 'dark' : 'light'}
        </button>
      )}
    </ThemeContext.Consumer>
  )
}

describe('ThemeContext tokens', () => {
  it('toggles data-theme attribute and persists', () => {
    render(<ThemeProvider><TestThemeToggle /></ThemeProvider>)
    const btn = screen.getByTestId('theme-btn')
    const before = document.documentElement.dataset.theme
    fireEvent.click(btn)
    const after = document.documentElement.dataset.theme
    expect(before).not.toBe(after)
    expect(['light','dark']).toContain(after)
    expect(localStorage.getItem('theme')).toBe(after)
  })
})