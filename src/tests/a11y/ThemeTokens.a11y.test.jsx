import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { ThemeProvider } from '../../contexts/ThemeContext.jsx'
import ThemeToggle from '../../components/ThemeToggle.jsx'

// Note: JSDOM does not evaluate our built CSS pipeline, so we only verify attribute + persistence.
describe('Dark theme toggle (a11y precondition)', () => {
  it('toggles data-theme attribute and persists preference', () => {
    const { container } = render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
    const btn = container.querySelector('button')
    // initial should be light (unless system prefers dark, but test env usually false)
    const initial = document.documentElement.dataset.theme
    fireEvent.click(btn)
    const after = document.documentElement.dataset.theme
    expect(['light','dark']).toContain(initial)
    expect(after).toBe('dark')
    expect(after).not.toBe(initial)
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})



